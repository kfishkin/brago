import React from 'react';
import { Layout } from 'antd';
import NavMenu from './NavMenu';
import GreatHall from './GreatHall';
import AboutPage from './AboutPage';
import { VERSION } from './AboutPage';
import Arena from './Arena';
import RaidJsonLoader from './RaidJsonLoader';
import ArtifactPage from './ArtifactPage';
import ArtifactBumpPage from './ArtifactBumpPage';
import ArtifactSellPage from './ArtifactSellPage';
import ChampionDetailPage from './ChampionDetailPage';
import ChampionPage from './ChampionPage';
import HeaderDetail from './HeaderDetail';
import HelpPage from './HelpPage';
import IdleTimer from 'react-idle-timer';
import ReactGA from 'react-ga';
import TotalStatsCalculator from './TotalStatsCalculator';


export const OTHER_GEAR_UNWORN = "unworn";
export const OTHER_GEAR_VAULT = "vault";
export const OTHER_GEAR_ALL = "all";

// how long should I wait before doing idle processing,
// AND how long does the idle process get to do its thing
const IDLE_HYSTERESIS = 300;

class TopLevel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentPage: 'none',
            greatHallLevels: {},
            lockedSlots: {}, // keys are gear types that are locked.
            eligibleRanks: {
                'one': true, 'two': true, 'three': true,
                'four': true, 'five': true, 'six': true
            },
            hasDoneSomething: true
            // setSpec map from set key to {None, Some, Set}. Default is 'Some'
            // fileName name of last loaded file.
        }
        this.idleTimer = null;
        this.idleCounter = 0;
        this.totalStatsCalculator = new TotalStatsCalculator();
    }
    handleShowPage(which) {
        this.setState({ currentPage: which });
    }
    componentDidMount() {
        ReactGA.initialize('UA-195025167-1');
        ReactGA.pageview(window.location.pathname + window.location.search);
        if (localStorage) {
            var fileName = localStorage.getItem("file_name");
            var artifacts = null;
            var champions = null;
            var arenaKey = null;
            var greatHallLevels = null;
            try {
                artifacts = JSON.parse(localStorage.getItem("file_artifacts"));
                champions = JSON.parse(localStorage.getItem("file_champions"));
                arenaKey = localStorage.getItem("arena_key");
                greatHallLevels = JSON.parse(localStorage.getItem("great_hall_levels"));
            } catch (err) {
            }

            this.onLoadJson(artifacts, champions, fileName, arenaKey, greatHallLevels);
        }
    };

    onAction(e) {
        //console.log(this.counter++, 'user did something', e)
        this.setState({ hasDoneSomething: true })
    }

    onActive(e) {
        //console.log(this.counter++, 'user is active', e)
        //this.setState({ hasDoneSomething: true })
    }

    computeTotalStatsFor(champion) {
        if (!champion) return;
        if ((champion.id in this.state.knownChampionTotalStats)) return;
        var stats = this.totalStatsCalculator.MakeAndBake(champion, this.state.arenaKey, this.state.greatHallLevels, this.state.artifactsById);
        //console.log('topLevel: computed stats for ' + champion.name);
        this.onComputeTotalStats(champion.id, stats);
    }

    doIdleProcessing() {
        // starting at (nextIndexForTotalStats), find a champion
        // whose total stats aren't known.
        var firstIndex = this.state.nextIndexForTotalStats;
        var champs = this.state.champions;
        if (!champs) return;
        var index = firstIndex;

        for (; ;) {
            if (index >= champs.length) {
                index = 0;
            }
            var champId = champs[index].id;
            if (champId in this.state.knownChampionTotalStats) {
                index++;
                if (index === firstIndex) {
                    //console.log('all champs have total stats');
                    return;
                }
            } else {
                this.computeTotalStatsFor(champs[index]);
                this.setState({ nextIndexForTotalStats: index + 1 });
                return;
            }
        }
    }

    onComputeTotalStats(champId, totalStats) {
        //console.log('just computed stats for champ id ' + champId);
        var cur = this.state.knownChampionTotalStats;
        cur[champId] = totalStats;
        this.setState({ knownChampionTotalStats: cur });

    }

    // called when app enters idle state.
    onIdle(e) {
        if (this.state.hasDoneSomething) {
            // not anymore, they haven't....
            this.setState({ hasDoneSomething: false });
            // and start the countdown...
            this.idleTimer.reset();
        } else {
            // time to do something on idle
            //console.log(this.counter++, 'DO ONIDLE')
            this.doIdleProcessing();
            // and start the countdown to the NEXT onIdle
            this.idleTimer.reset();
        }
    }

    onLoadJson(artifacts, champions, fileName, arenaKey, greatHallLevels) {
        if (arenaKey) {
            arenaKey = arenaKey.toLowerCase();
        }
        var artifactsById = {}
        if (artifacts) {
            artifacts.forEach((artifact) => {
                artifactsById[artifact.id] = artifact;
            });
        }
        if (champions) {
            champions.forEach((champion) => {
                if ('artifacts' in champion) {
                    champion.artifacts.forEach((artifactId) => {
                        if (artifactId in artifactsById) {
                            artifactsById[artifactId].wearer = champion;
                        }
                    });
                };
            });
        }
        if (localStorage) {
            if (fileName) {
                localStorage.setItem("file_name", fileName);
                localStorage.setItem("file_artifacts", JSON.stringify(artifacts));
                localStorage.setItem("file_champions", JSON.stringify(champions));
                localStorage.setItem("great_hall_levels", JSON.stringify(greatHallLevels));
                localStorage.setItem("arena_key", arenaKey);
            } else {
                localStorage.removeItem("file_name");
                localStorage.removeItem("file_artifacts");
                localStorage.removeItem("file_champions");
                localStorage.removeItem("great_hall_levels");
                localStorage.removeItem("arena_key");
            }
        }

        this.setState({
            artifacts: artifacts,
            artifactsById: artifactsById,
            champions: champions,
            fileName: fileName,
            arenaKey: arenaKey,
            greatHallLevels: greatHallLevels,
            knownChampionTotalStats: {},
            nextIndexForTotalStats: 0
        });
    }

    onNewTotalStatsBulk(newTotals) {
        this.setState({ knownChampionTotalStats: newTotals });
    }

    onChooseChampion(champion) {
        var gearByIds = {};
        if (champion && champion.artifacts) {
            champion.artifacts.forEach((artifactId) => {
                gearByIds[artifactId] = true;
            });
        }
        this.setState({ curChamp: champion });
    }

    renderContent() {
        var whichPage = this.state.currentPage;
        // default page on returning is the champion chooser page.
        if (whichPage === "none" && this.state.champions && this.state.champions.length > 0) {
            whichPage = 'champion chooser';
        }

        switch (whichPage) {
            case 'about':
                return <AboutPage />;
            case 'arena':
                return <Arena
                    arenaKey={this.state.arenaKey} />
            case 'artifacts':
                if ('artifacts' in this.state) {
                    return (<ArtifactPage artifacts={this.state.artifacts} />);
                } else {
                    return (
                        <RaidJsonLoader fileName={this.state.fileName} reporter={(artifacts, champions, fileName, arenaKey, greatHallLevels) => this.onLoadJson(artifacts, champions, fileName, arenaKey, greatHallLevels)} />
                    )
                }
            case 'bump artifacts':
                if ('artifacts' in this.state) {
                    return (<ArtifactBumpPage artifacts={this.state.artifacts} />);
                } else {
                    return (
                        <RaidJsonLoader fileName={this.state.fileName} reporter={(artifacts, champions, fileName, arenaKey, greatHallLevels) => this.onLoadJson(artifacts, champions, fileName, arenaKey, greatHallLevels)} />
                    )
                }
            case 'sell artifacts':
                if ('artifacts' in this.state) {
                    return (<ArtifactSellPage artifacts={this.state.artifacts} />);
                } else {
                    return (
                        <RaidJsonLoader fileName={this.state.fileName} reporter={(artifacts, champions, fileName, arenaKey, greatHallLevels) => this.onLoadJson(artifacts, champions, fileName, arenaKey, greatHallLevels)} />
                    )
                }
            case 'champion chooser':
                if ('champions' in this.state) {
                    return (<ChampionDetailPage
                        champions={this.state.champions}
                        artifactsById={this.state.artifactsById}
                        curChamp={this.state.curChamp}
                        arenaKey={this.state.arenaKey}
                        greatHallLevels={this.state.greatHallLevels}
                        knownChampionTotalStats={this.state.knownChampionTotalStats}
                        onComputeTotalStats={(champId, stats) => this.onComputeTotalStats(champId, stats)}
                        reporter={(champion) => this.onChooseChampion(champion)} />);
                } else {
                    return (
                        <RaidJsonLoader fileName={this.state.fileName} reporter={(artifacts, champions, fileName, arenaKey, greatHallLevels) => this.onLoadJson(artifacts, champions, fileName, arenaKey, greatHallLevels)} />
                    )
                }
            case 'champions':
                if ('champions' in this.state) {
                    return (<ChampionPage fileName={this.state.fileName} champions={this.state.champions}
                        knownChampionTotalStats={this.state.knownChampionTotalStats}
                        reportNewTotalStats={(newStats) => this.onNewTotalStatsBulk(newStats)}
                        arenaKey={this.state.arenaKey}
                        greatHallLevels={this.state.greatHallLevels}
                        artifactsById={this.state.artifactsById} />);
                } else {
                    return (
                        <RaidJsonLoader fileName={this.state.fileName} reporter={(artifacts, champions, fileName, arenaKey, greatHallLevels) => this.onLoadJson(artifacts, champions, fileName, arenaKey, greatHallLevels)} />
                    )
                }
            case 'great hall':
                return <GreatHall
                    greatHallLevels={this.state.greatHallLevels}
                    reporter={(affinity, attr, value) => this.onGreatHallNewState(affinity, attr, value)} />
            case 'help':
                return <HelpPage />;
            case 'load json':
                return (
                    <RaidJsonLoader fileName={this.state.fileName} reporter={(artifacts, champions, fileName, arenaKey, greatHallLevels) => this.onLoadJson(artifacts, champions, fileName, arenaKey, greatHallLevels)} />
                );
            default:
                return (<p>Please start by clicking on 'Load JSON' and loading a JSON file</p>);
        }
    }
    render() {
        const { Header, Footer, Sider, Content } = Layout;
        return (
            <Layout>
                <Header>
                    <IdleTimer
                        ref={ref => { this.idleTimer = ref }}
                        element={document}
                        onActive={(e) => this.onActive(e)}
                        onIdle={(e) => this.onIdle(e)}
                        onAction={(e) => this.onAction(e)}
                        debounce={100}
                        timeout={IDLE_HYSTERESIS} />
                    <HeaderDetail
                        curChamp={this.state.curChamp} fileName={this.state.fileName}></HeaderDetail></Header>
                <Layout>
                    <Sider><NavMenu haveChamps={false}
                        artifacts={this.state.artifacts}
                        champions={this.state.champions}
                        curChamp={this.state.curChamp}
                        arenaKey={this.state.arenaKey}
                        greatHallLevels={this.state.greatHallLevels}
                        lockedSlots={this.state.lockedSlots}
                        eligibleRanks={this.state.eligibleRanks}
                        handleShowPage={(which) => this.handleShowPage(which)}
                        fileName={this.state.fileName}
                    />
                    </Sider>
                    <Content>{this.renderContent()}</Content>
                </Layout>
                <Footer style={{ 'textAlign': 'left' }}><span>Brago version {VERSION}</span></Footer>
            </Layout>
        );

    }
}

export default TopLevel;
