import React from 'react';
import { Layout } from 'antd';
import NavMenu from './NavMenu';
import GreatHall from './GreatHall';
import AboutPage from './AboutPage';
import { VERSION } from './AboutPage';
import Arena from './Arena';
import ArtifactFilterer from './ArtifactFilterer';
import {
    FILTER_IN, FILTER_OUT, FILTER_MAYBE, FILTER_IN_CURRENT_GEAR,
    FILTER_OUT_JEWELRY_BY_FACTION, FILTER_OUT_BY_SLOT, FILTER_OUT_BY_WEARER,
    FILTER_OUT_BY_RANK, FILTER_OUT_BY_SET
} from './ArtifactFilterer';
import RaidJsonLoader from './RaidJsonLoader';
import ArtifactPage from './ArtifactPage';
import ArtifactBumpPage from './ArtifactBumpPage';
import ArtifactSellPage from './ArtifactSellPage';
import ChampionDetailPage from './ChampionDetailPage';
import ChampionPage from './ChampionPage';
import greatHallConfig from './config/great_hall.json';
import Cookies from 'universal-cookie';
import HeaderDetail from './HeaderDetail';
import HelpPage from './HelpPage';
import LockComponent from './LockComponent';
import OtherChampionsComponent from './OtherChampionsComponent';
import WhichRanksComponent from './WhichRanksComponent';
import WhichSetsComponent from './WhichSetsComponent';

export const OTHER_GEAR_UNWORN = "unworn";
export const OTHER_GEAR_VAULT = "vault";
export const OTHER_GEAR_ALL = "all";

class TopLevel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentPage: 'none',
            greatHallData: [],
            lockedSlots: {}, // keys are gear types that are locked.
            eligibleRanks: {
                'one': true, 'two': true, 'three': true,
                'four': true, 'five': true, 'six': true
            }
            // setSpec map from set key to {None, Some, Set}. Default is 'Some'
        }
        this.artifactFilterer = new ArtifactFilterer();
    }
    handleShowPage(which) {
        this.setState({ currentPage: which });
    }
    componentDidMount() {

        // is the arena state in a cookie?
        const cookies = new Cookies();
        var arenaCookie = cookies.get('arenaLevel');
        if (arenaCookie) {
            this.setState({ arenaLevel: arenaCookie });
        }
        // what about great hall state?
        var newRows = [];
        var hallCookie = cookies.get('greatHallData');

        if (hallCookie) {
            newRows = hallCookie;
        } else {
            // make the initial values for great hall data
            greatHallConfig.rows.forEach((rowData) => {
                var newRow = {
                    key: rowData.key
                };
                greatHallConfig.columns.forEach((columnData) => {
                    var attr = columnData.key;
                    newRow[attr] = 0;
                });
                newRows.push(newRow);
            });
        }

        this.setState({ greatHallData: newRows });
    };

    onGreatHallNewState(affinity, attr, value) {
        // find the row by key. Very few rows, speed not an issue.
        var newRows = Object.assign(this.state.greatHallData);
        var rowNum = 0;
        for (; rowNum < newRows.length; rowNum++) {
            if (newRows[rowNum].key === affinity) {
                break;
            }
        }
        if (rowNum >= newRows.length) {
            // this happens the first time they click in a new row.
            newRows.push({
                key: affinity
            });
        }
        newRows[rowNum][attr] = value;
        this.setState({ greatHallData: newRows });
        const cookies = new Cookies();
        cookies.set('greatHallData', JSON.stringify(newRows), { path: '/' });
    }
    onArenaSetLevel(arenaData) {
        this.setState({ arenaLevel: arenaData });
        const cookies = new Cookies();
        cookies.set('arenaLevel', JSON.stringify(arenaData), { path: '/' });

    }
    onLoadJson(artifacts, champions) {
        var artifactsById = {}
        artifacts.forEach((artifact) => {
            artifactsById[artifact.id] = artifact;
        });
        champions.forEach((champion) => {
            if ('artifacts' in champion) {
                champion.artifacts.forEach((artifactId) => {
                    if (artifactId in artifactsById) {
                        artifactsById[artifactId].wearer = champion;
                    }
                });
            };
        });

        this.setState({
            artifacts: artifacts,
            artifactsById: artifactsById,
            champions: champions
        });
    }

    SetFilteredArtifacts() {
        if (!this.state.artifacts) {
            this.setState({ filteredArtifactsByKind: {} });
            return;
        }
        var firstPass = {};
        this.state.artifacts.forEach((artifact) => {
            if (this.artifactFilterer.IsWearable(artifact)) {
                var kind = artifact.kind;
                if (!(kind in firstPass)) {
                    firstPass[kind] = [];
                }
                firstPass[kind].push(artifact);
            }
        });
        this.setState({ filteredArtifactsByKind: firstPass });
    }

    onLockSlotChange(slot) {
        //console.log('toplevel: lock slot change for ' + slot);
        var newMap = Object.assign(this.state.lockedSlots);
        if (slot in newMap) {
            delete newMap[slot];
        } else {
            newMap[slot] = true;
        }
        this.artifactFilterer.SetFilterer(FILTER_OUT_BY_SLOT, (artifact) => {
            var toss = artifact && artifact.kind && (artifact.kind.toLowerCase() in newMap);
            return toss ? FILTER_OUT : FILTER_MAYBE;
        });
        this.setState({ lockedSlots: newMap });
        this.SetFilteredArtifacts();

    }

    onChooseChampion(champion) {
        var gearByIds = {};
        if (champion && champion.artifacts) {
            champion.artifacts.forEach((artifactId) => {
                gearByIds[artifactId] = true;
            });
        }

        this.artifactFilterer.SetFilterer(
            FILTER_IN_CURRENT_GEAR, (artifact) => {
                if (artifact.id in gearByIds) return FILTER_IN;
                return FILTER_MAYBE;
            });
        var faction = champion.fraction.toLowerCase();
        this.artifactFilterer.SetFilterer(FILTER_OUT_JEWELRY_BY_FACTION,
            (artifact) => {
                if (!artifact.requiredFraction) return FILTER_MAYBE;
                var gearFaction = artifact.requiredFraction.toLowerCase();
                return (faction === gearFaction) ? FILTER_MAYBE : FILTER_OUT;
            });
        this.SetFilteredArtifacts();
        this.setState({ curChamp: champion });
    }

    onOtherChampionsSpecChange(setting) {
        if (setting === this.state.otherChampionGearMode) return;
        var excludedIds = {};
        // find all the worn gear by (a) anyone, or
        // (b) anyone not in valut, depending.
        if (this.state.champions) {
            this.state.champions.some((champion) => {
                if (setting === OTHER_GEAR_ALL) {
                    return false; // you can take from this guy...
                }
                if (setting === OTHER_GEAR_VAULT && champion.inStorage) {
                    //ditto
                    return false;
                }
                // to get to here, this champ's gear is off limits.
                if (champion.artifacts) {
                    champion.artifacts.forEach((artifactId) => {
                        excludedIds[artifactId] = true;
                    });
                }
                return false;
            });
        }
        this.artifactFilterer.SetFilterer(FILTER_OUT_BY_WEARER, (artifact) => {
            return (artifact && artifact.id && (artifact.id in excludedIds))
                ? FILTER_OUT : FILTER_MAYBE;
        });
        this.SetFilteredArtifacts();


        this.setState({ otherChampionGearMode: setting });
    }

    onWhichRanksChange(rankName, nowIn) {
        var newSet = Object.assign(this.state.eligibleRanks);
        if (nowIn) {
            newSet[rankName.toLowerCase()] = true;
        } else {
            delete newSet[rankName.toLowerCase()];
        }
        this.artifactFilterer.SetFilterer(FILTER_OUT_BY_RANK, (artifact) => {
            var rank = (artifact && artifact.rank) ? artifact.rank.toLowerCase() : 'xx';
            return (rank in newSet) ? FILTER_MAYBE : FILTER_OUT;
        });
        this.SetFilteredArtifacts();
        this.setState({ eligibleRanks: newSet });
    }

    onSetSpecChange(key, value) {
        //key = key.toLowerCase();
        console.log('top: set spec change of ' + key + ' to ' + value);
        if (this.state.setSpec && (key in this.state.setSpec)
            && (this.state.setSpec[key] === value)) {
            return;
        }
        var newMap = {};
        if (this.state.setSpec) {
            newMap = Object.assign(this.state.setSpec);
        }
        newMap[key] = value;
        this.artifactFilterer.SetFilterer(FILTER_OUT_BY_SET, (artifact) => {
            if (!artifact || !('setKind' in artifact)) {
                return FILTER_MAYBE; // happens on accessories
            }
            var kind = artifact.setKind;
            if (!(kind in newMap)) {
                return FILTER_MAYBE; // default is to allow.
            }
            var setting = newMap[kind];
            //console.log('kind = ' + kind + ', setting = ' + setting);
            return (setting.toLowerCase() === "none") ? FILTER_OUT : FILTER_MAYBE;
        });
        this.SetFilteredArtifacts();
        this.setState({ setSpec: newMap });
    }

    renderContent() {
        const whichPage = this.state.currentPage;

        switch (whichPage) {
            case 'about':
                return <AboutPage />;
            case 'arena':
                return <Arena
                    arenaLevel={this.state.arenaLevel}
                    reporter={(arenaData) => this.onArenaSetLevel(arenaData)} />
            case 'artifacts':
                if ('artifacts' in this.state) {
                    return (<ArtifactPage artifacts={this.state.artifacts} />);
                } else {
                    return (
                        <RaidJsonLoader reporter={(artifacts, champions) => this.onLoadJson(artifacts, champions)} />
                    )
                }
            case 'bump artifacts':
                if ('artifacts' in this.state) {
                    return (<ArtifactBumpPage artifacts={this.state.artifacts} />);
                } else {
                    return (
                        <RaidJsonLoader reporter={(artifacts, champions) => this.onLoadJson(artifacts, champions)} />
                    )
                }
            case 'sell artifacts':
                if ('artifacts' in this.state) {
                    return (<ArtifactSellPage artifacts={this.state.artifacts} />);
                } else {
                    return (
                        <RaidJsonLoader reporter={(artifacts, champions) => this.onLoadJson(artifacts, champions)} />
                    )
                }
            case 'champion chooser':
                if ('champions' in this.state) {
                    return (<ChampionDetailPage
                        champions={this.state.champions}
                        artifactsById={this.state.artifactsById}
                        curChamp={this.state.curChamp}
                        arenaLevel={this.state.arenaLevel}
                        greatHallData={this.state.greatHallData}
                        reporter={(champion) => this.onChooseChampion(champion)} />);
                } else {
                    return (
                        <RaidJsonLoader reporter={(artifacts, champions) => this.onLoadJson(artifacts, champions)} />
                    )
                }
            case 'champions':
                if ('champions' in this.state) {
                    return (<ChampionPage champions={this.state.champions} artifactsById={this.state.artifactsById} />);
                } else {
                    return (
                        <RaidJsonLoader reporter={(artifacts, champions) => this.onLoadJson(artifacts, champions)} />
                    )
                }
            case 'gear to lock':
                return (<LockComponent
                    filteredArtifactsByKind={this.state.filteredArtifactsByKind}
                    curChamp={this.state.curChamp}
                    artifactsById={this.state.artifactsById}
                    lockedSlots={this.state.lockedSlots}
                    reporter={(slot) => this.onLockSlotChange(slot)}
                />);
            case 'great hall':
                return <GreatHall
                    greatHallData={this.state.greatHallData}
                    reporter={(affinity, attr, value) => this.onGreatHallNewState(affinity, attr, value)} />
            case 'help':
                return <HelpPage />;
            case 'load json':
                return (
                    <RaidJsonLoader reporter={(artifacts, champions) => this.onLoadJson(artifacts, champions)} />
                );
            case 'other champions':
                return (<OtherChampionsComponent
                    champions={this.state.champions}
                    filteredArtifactsByKind={this.state.filteredArtifactsByKind}
                    otherChampionGearMode={this.state.otherChampionGearMode}
                    reporter={(setting) => this.onOtherChampionsSpecChange(setting)}
                />);
            case 'ranks chooser':
                return (<WhichRanksComponent
                    artifacts={this.state.artifacts}
                    filteredArtifactsByKind={this.state.filteredArtifactsByKind}
                    eligibleRanks={this.state.eligibleRanks}
                    reporter={(rankName, nowIn) => this.onWhichRanksChange(rankName, nowIn)}
                />);
            case 'set chooser':
                return (<WhichSetsComponent
                    filteredArtifactsByKind={this.state.filteredArtifactsByKind}
                    setSpec={this.state.setSpec}
                    reporter={(key, value) => this.onSetSpecChange(key, value)}
                />);
            default:
                return (<p>Please start by clicking on 'Load JSON' and loading a JSON file</p>);
        }
    }
    render() {
        const { Header, Footer, Sider, Content } = Layout;
        return (
            <Layout>
                <Header><HeaderDetail
                    curChamp={this.state.curChamp}></HeaderDetail></Header>
                <Layout>
                    <Sider><NavMenu haveChamps={false}
                        artifacts={this.state.artifacts}
                        champions={this.state.champions}
                        curChamp={this.state.curChamp}
                        arenaLevel={this.state.arenaLevel}
                        greatHallData={this.state.greatHallData}
                        lockedSlots={this.state.lockedSlots}
                        otherChampionGearMode={this.state.otherChampionGearMode}
                        eligibleRanks={this.state.eligibleRanks}
                        handleShowPage={(which) => this.handleShowPage(which)} /></Sider>
                    <Content>{this.renderContent()}</Content>
                </Layout>
                <Footer style={{ 'textAlign': 'left' }}><span>Brago version {VERSION}</span></Footer>
            </Layout>
        );

    }
}

export default TopLevel;
