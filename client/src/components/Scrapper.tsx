import React, { Component } from 'react';
import axios from 'axios';

class Scrapper extends Component {
  state = {
    maxPages: 0,
    currentPage: 0,
    storiesScrapped: 0,
    errors: [],
  };

  getPages = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/pages');
      console.log(res.data);
    } catch (error) {
      this.setState({ errors: [...this.state.errors, error] });
    }
  };

  render() {
    return (
      <div className="content">
        <a className="button" onClick={this.getPages}>
          Load pages
        </a>
      </div>
    );
  }
}

export default Scrapper;
