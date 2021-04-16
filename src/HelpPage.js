import React from 'react';

class HelpPage extends React.Component {
    render() {
        return (<div className="help_page" style={{ textAlign: 'left' }}>

            <p>Welcome! This program, 'Brago', can take a JSON file containing
        the state of your <i>Raid Shadow Legends</i> champions and artifacts,
        and perform a few simple analyses on them.
    </p>
            <p>
                You <i>get</i> the JSON file in the first place by using
            Jake Croteau's great <a href="https://github.com/LukeCroteau/RaidExtractor">RaidExtractor</a>.
            Go to that site and read about how the tool and how to use it.
            Once you have a JSON file you created with it, then you can use
            Brago.
        </p>

            <p>
                Brago shows you a list of things you can do, on the left nav-menu: "Load JSON", "View Champions", etc.
                You can't really do anything interesting until you've loaded your JSON file,
                so start by doing that. click on the "Load JSON" selection, then on the "Choose File" button,
                and open the JSON file you want analyzed.
        </p>
            <p>
                You will then see the left nav menu change, to show that you
                now have loaded the data. For example, something like this:
                </p>
            <img src="pix/help/left_nav_after_load.png" alt="nav menu after load" />
            <h3>The pages</h3>
            <ul>
                <li><a href="#view_champions">The 'View Champions' page</a></li>
                <li><a href="#view_artifacts">The 'View Artifacts' page</a></li>
                <li><a href="#to_bump">The 'Artifacts to bump' page</a></li>
                <li><a href="#to_sell">The 'Artifacts to Sell' page</a></li>
                <li><a href="#champion_detail">The 'Champion Detail' page</a></li>
                <li><a href="#arena">The 'Arena Tier' screen</a></li>
                <li><a href="#great_hall">The 'Great Hall' page</a></li>


            </ul>
            <h2 id="view_champions">The 'View (some) Champions' screen</h2>
            <p>
                This screen lets you view some champions - those who pass
                some filters, where you indicate which filters you are interested in.
        </p>
            <p>
                The default filter is to only show champions who aren't in the vault. So for example, you'll see initially
                something like this:
        </p>
            <img src="pix/help/champions_start.png" alt="champions who aren't in the vault" />
            <p>
                The filters are hopefully self-explanatory, and some have tooltips that explain what they do in
                more detail if you hover over them. For example, the 'under-ascended' hover says
                'fewer ascensions than rank'. If I turn that filter on,
                it shows that in my I have 169 champions that fit that description, however many of them are 'food'
                or in the vault.
        </p>
            <img src="pix/help/champions_under_ascended.png" alt="champions who are under-ascended" />
            <p>
                To cut that down further, I can add more filters. For example,
                the 'Rank' filter lets you only include champions at a certain
                level or above, or a certain level or below (indicate which by
                clicking on the &le;/&ge; symbol).
            </p>
            <p>
                In my case, if I indicate that I only want champions of rank 5
                or more, now we're down to 7:
            </p>
            <img src="pix/help/champions_under_ascended_2.png" alt="champions who are under-ascended" />
            <p>
                The second champion has no name - this happens when a new champion has been added
                to the game and the 'extractor' doesn't know about them yet.
</p>
            <p>
                Lastly, let's add another filter, and only count champions who aren't in the vault:
</p>
            <img src="pix/help/champions_under_ascended_3.png" alt="champions who are under-ascended" />
            <p>
                Note the 'why' column, which can give more detail from the filter.
                By the way, if you have more than one filter on, presently it will only
            give you extra detail from the <i>last</i> filter in the list at the top.
        </p>
            <h2 id="view_artifacts">The 'View Artifacts' screen</h2>
            <p>
                This screen isn't really very useful either, it just dumps out
                all the info on your artifacts that was in the JSON. At this point
                it's more just for debugging.
        </p>
            <h2 id="to_bump">The 'Artifacts to bump' screen</h2>
            <p>
                When you're in an artifact enhancement event, you only
                get points when an artifact is enhanced to a level that's
                a multiple of 4 (4,8,12,16).
        </p>
            <p>
                Many players enhance artifacts to just short
                of a multiple of 4 when not in an artifact enhancement event.
                Then when the event comes you get the points while spending a lot less money.
        </p>
            <p>
                If that's of interest to you, press this button and you'll see
                something like this:
            <img src="pix/help/bump_output.png" alt="display of artifacts to bump" />
            </p>
            <p>
                At the top, it's telling you how many artifacts you could 'bump', and how many event
                VP you will gain if you bump them all.
            </p>
            <p>
                Then it shows you the candidates. For example, in this case, the first candidate
                is a 5* Rare Demonspawn ring, that's at level 11.
            </p>
            <p>
                The dropdown 'Sort on' lets you specify which attribute of the artifacts you want to
                sort on (assuming you do). You can sort by rank, level, faction, rarity, etc.
                Specify that with the drop-down and then click on the little arrows to sort.
            </p>
            <h2 id="to_sell">The 'Artifacts to sell' screen</h2>
            <p>
                If you're like me, you're always running out of room for your Artifacts.
                This screen helps you with that. It shows a bunch of heuristics that I've collected
                from youtubers like 'Ash', 'HellHades', and 'MurderInc' about what to sell.
                You can turn them on/off individually.
            </p>
            <p>
                When you first come to the page, it'll look something like this:
                <img src="pix/help/sell_top.png" alt="checks to run" />
            </p>
            <p>The 'Check worn gear?' toggle lets you tell it whether or not to check for gear that's worn. That gear
            doesn't count against your limit, so often you don't want that checked.
            </p>
            <p>
                Then, you see the list of all the checks that can be run: <b>12</b>
                at present.
            </p>
            <p>
                Each one is individually selectable, and by default they all start 'off'.
                That's why you don't see anything recommended at the start.
            </p>
            <p>
                The most aggressive one is probably '&gt; 2 substats, none SPD'. Turn that
                toggle on, and you'll see the display change to something like this:
                <img src="pix/help/sell_1.png" alt="1 check on" />
            </p>
            <p>
                This one check found 332 possible artifacts to sell for me. The first two
                are a 6* Epic 'Divine Speed' Weapon, and a 5* Epic Immortal Gloves.
            </p>
            <p>
                You can sort this output on any column - for example, you may want this grouped by
                which set it belongs to.
            </p>
            <p>
                Note the last column, 'why'. This shows you why this piece was recommended
                for selling. This is useful if you turn on multiple checks and yuou want to see
                which one was responsible for a particular row. Note that an artifact may show up
                more than once, if more than one check flags it.
            </p>
            <p>
                Now, turn on the 'Check worn gear' toggle and you'll see the total go up. For example, in the output below,
                the first two pieces are worn by 'Hurler' and 'Grinner':
                <img src="pix/help/sell_worn.png" alt="include worn gear" />
            </p>
            <h2 id="champion_detail">The 'Champion Detail' screen</h2>
            <p>
                The visuals on this page are very rough, so be kind :).
                It lets you view all the information about a champion, including, most importantly,
                a more detailed breakdown of their 'total stats' than the game gives you.
            </p>
            <p>
                Once you've loaded a JSON file, if you go to this page, you will see an auto-complete box.
                This lets you choose which champion you want details on.
                <img src="pix/help/detail_auto_start.png" alt="champion chooser" />
            </p>
            <p>
                As you type, you will see champions who have what you've typed in their name. For example, below you see what
                I get after typing 'Arm'. If you've put a marker on your champ, you will see that in parentheses.
                For example, I have an Armiger with the 'Build II' marker. If you <i>don't</i> have a marker
                on the champ, you will see its ID in parentheses, this helps you if you have a buncha champions
                with the same name and you haven't put markers on them.
                <img src="pix/help/detail_auto_typing.png" alt="typing away" />
            </p>
            <p>
                In this case, I picked Kael (we <i>all</i> have a Kael, right? :)
                Note three things at the top of the screen:
                <img src="pix/help/detail_top.png" alt="the top 3 lines" />
            </p>
            <ul>
                <li>The 'Looking at' line in the header shows who you chose, and you'll see it as you go
                into other pages in the app. The idea is that someday you might be able to
                do other things, like optimize gear or whatever.
                    </li>
                <li>
                    The chooser is still there - type somebody else's name to pick a diffferent champ.

                    </li>
                <li>
                    The third line is just like the first, but starts to add more detail.
                    </li>
            </ul>
            <p>
                Below that, you'll see a dump of all the gear your champion is wearing, including
                main stats, sub stats, and enhancements (those are in the parens after a substat).
                For example, my Kael has an Epic 5* Speed weapon, level 16, with an Attack main stat. The first substat is a 5% boost to 'Atk %', enchanted to 7%.
                </p>
            <img src="pix/help/detail_artifacts.png" alt="the top 3 lines" />
            <p>
                Below that, you'll see the 'Known Masteries'. Brago only knows about some of the masteries in the game - I'm
                adding to the list as I uncover the meaning of the IDs the game assigns to masteries.
                In this case, you'll see Brago knows about 7 of Kael's masteries, including
                'Lore of Steel' (you get this by hovering over an icon).
                </p>
            <img src="pix/help/detail_masteries.png" alt="the masteries" />
            <p>
                The best comes last: the 'total stats'. This is the same as the 'total stats' you see in the game, or at least
                tries to be. It includes your Great Hall bonuses (if you entered those in), and your Arena level (if you entered thos in),
                and your masteries (for masteries Brago knows about). The results should be within 1 of
                what you see in the game - there can be rounding differences. If you see a difference of more than 1,
                it means there's a mastery I don't know about yet. If you see this, if you could send me your JSON file, with a description of the
                champion and the mastery that's missing, that would help.
                </p>
            <img src="pix/help/detail_stats.png" alt="the masteries" />
            <p>
                The one thing here that adds value over what you see in the game are the numbers
                    in <span color="blue">blue</span>. If you hover over those, you will get a detailed
                    breakdown. For example, if I hover over the '14871' HP I get from Artifacts,
                    I can see this broken down. I find this helpful.
                </p>
            <img src="pix/help/detail_breakdown.png" alt="stat breakdown" />
            <h2 id="arena">The 'Arena Tier' screen</h2>
            <p>
                This page lets you enter what Arena Tier you're in (it's not stored in the JSON file).
                If you enter it, this will be used on the 'Champion Detail' page when computing your total stats.
            </p>
            <p>
                The information is stored in a cookie, so you don't have to re-type it every time
                you come to the site.
            </p>
            <h2 id="great_hall">The 'Great Hall' screen</h2>
            <p>
                This page lets you enter your Great Hall levels (it's not stored in the JSON file).
                If you enter it, this will be used on the 'Champion Detail' page when computing your total stats.
            </p>
            <p>
                The information is stored in a cookie, so you don't have to re-type it every time
                you come to the site.
            </p>
        </div >
        );
    }
}
export default HelpPage;