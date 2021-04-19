import React from 'react';

class RaidJsonLoader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fileReader: null,
      statusMessage: null,
      errorMessage: null
    }
  }

  handleFileRead(e, fileName) {
    var content = this.state.fileReader.result;
    this.setState({ fileReader: null, statusMessage: "done loading" });
    var obj = null;
    try {
      obj = JSON.parse(content);
    } catch (err) {
      this.setState({ fileReader: null, errorMessage: err.message, statusMessage: "error loading" });
      return;
    }
    this.setState({ fileReader: null, errorMessage: null });
    console.log('arena league = ' + obj.arenaLeague);
    this.props.reporter(obj.artifacts, obj.heroes, fileName, obj.arenaLeague);
    var msg = "data loaded";
    this.setState({ statusMessage: msg });
  }

  handleLoadStart(e) {
    this.setState({ statusMessage: "started to load..." });
  }

  handleFileChosen(fileObj) {
    var fileReader = new FileReader();
    fileReader.onloadend = (e) => this.handleFileRead(e, fileObj.name);
    fileReader.onloadstart = (e) => this.handleLoadStart(e);
    this.setState({ 'fileReader': fileReader });
    fileReader.readAsText(fileObj);

  }
  render() {
    return (
      <div>
        <p>Upload the JSON file you got from RaidExtractor,
        that will load the Champions and Artifacts for further use.
          </p>
        <p>
          {this.state.statusMessage ? (<span>{this.state.statusMessage}</span>) : ''}
        </p>
        <input type='file' accept='.json'
          onChange={e => this.handleFileChosen(e.target.files[0])} />
        {this.state.errorMessage ? (<div className="error_message">{this.state.errorMessage}</div>) : null}
      </div>
    );
  }
}

export default RaidJsonLoader;