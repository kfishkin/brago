import React from 'react';

export const VERSION = "1.0";

class AboutPage extends React.Component {
    render() {
        return (<div>
            <p>Version {VERSION}.</p>
            <p>Project is on Github at (somewhere)</p>
        </div>);
    }
}
export default AboutPage;