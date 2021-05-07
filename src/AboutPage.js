import React from 'react';

export const VERSION = "1.15";

class AboutPage extends React.Component {
    render() {
        return (<div>
            <p>Version {VERSION}.</p>
            <p>Project is on Github at https://github.com/kfishkin/brago</p>
        </div>);
    }
}
export default AboutPage;