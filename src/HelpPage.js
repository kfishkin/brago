import React from 'react';

class HelpPage extends React.Component {
    render() {
        return (<div style={{ textAlign: 'left' }}>

            <p>Welcome! This program can take a JSON file containing
        the state of your <i>Raid Shadow Legends</i> champions and artifacts,
        and perform a few simple analyses on them.
    </p>
            <p>
                You <i>get</i> the JSON file in the first place by using
            Jake Croteau's great <a href="https://github.com/LukeCroteau/RaidExtractor">RaidExtractor</a>.
            Go to that site and read about how the tool and how to use it.
            Once you have a JSON file you created with it, then you can use
            this program.
        </p>

            <p>
                The program shows you a list of things you can do, on the left nav-menu: "Load JSON", "View Champions", etc.
                You can't really do anything interesting until you've loaded your JSON file,
                so start by doing that. click on the "Load JSON" selection, then on the "Choose File" button,
                and open the JSON file you want analyzed.
        </p>
            <p>
                You will then see the left nav menu change, to show that you
                now have loaded the data. For example, something like this:
            <img src="pix/help/left_nav_after_load.png" alt="nav menu after load" />
            </p>
            <h2>The 'View Champions' screen</h2>
            <p>
                This screen isn't really very useful, it just dumps out
                all the info on your champions that was in the JSON. At this point
                it's more just for debugging.
        </p>
            <h2>The 'View Artifacts' screen</h2>
            <p>
                This screen isn't really very useful either, it just dumps out
                all the info on your artifacts that was in the JSON. At this point
                it's more just for debugging.
        </p>
            <h2>The 'Check for artifacts to bu...' screen</h2>
            <p>
                The 'bu...' is the word 'bumped', clipped.
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
                is a 5* Rare Destroy helmet, that's at level 11.
            </p>
            <p>
                You can sort by every column that has the little up-and-down
                arrows by it. So for example you could group them by what 'Set'
                they're from, or what Artifact slot they take.
            </p>
            <h2>The 'Check for artifacts to sell' screen</h2>
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
                The most aggressive one is probably 'Epic or Lego without SPD substat'. Turn that
                toggle on, and you'll see the display change to something like this:
                <img src="pix/help/sell_1.png" alt="1 check on" />
            </p>
            <p>
                This one check found 319 possible artifacts to sell for me. The first two
                are a 5* Epic Immortal Gloves, and a 5* Epic Speed Chest.
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
                the first two pieces are worn by 'Hurler' and 'Grinner', while the third piece is unworn:
                <img src="pix/help/sell_worn.png" alt="include worn gear" />
            </p>
        </div>
        );
    }
}
export default HelpPage;