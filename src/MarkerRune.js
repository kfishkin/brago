import React from 'react';
import Formatter from './Formatter';
import markersConfig from './config/markers.json';

/**
 * Shows the 'rune' for a champion marker.
 * 
 * props:
 * marker - text key
 */
class MarkerRune extends React.Component {
  constructor(props) {
    super(props);
    // map from key to spec.
    var keyToSpec = {};
    markersConfig.markers.forEach((markerSpec) => {
      keyToSpec[markerSpec.key.toLowerCase()] = markerSpec;

    });
    this.state = {
      'keyToSpec': keyToSpec
    }

  }
  render() {
    var key = this.props.marker;
    if (!key) return null;
    key = key.toLowerCase();
    if (key === "none") return null;
    var spec = this.state.keyToSpec[key];
    if (!spec) return null;
    var formatter = new Formatter();
    return formatter.Image(spec.icon, spec.label, { "className": "marker_icon" });
  }
}

export default MarkerRune;