import React, { Component } from 'react';
import axios from 'axios';
import { Formik, Field, Form } from 'formik';

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
      this.setState({ maxPages: res.data });
    } catch (error) {
      this.setState({ errors: [...this.state.errors, error] });
    }
  };

  startScrapping = () => {};

  render() {
    return (
      <div className="content">
        <div>
          <a className="button" onClick={this.getPages}>
            Load pages
          </a>
        </div>
        <div>
          <Formik
            initialValues={{
              pageStart: 0,
              pageEnd: 0,
            }}
            onSubmit={async (values, actions) => {
              try {
                const { pageStart, pageEnd } = values;
                const res = await axios.post('/api/scrap', { pageStart, pageEnd });
                // TODO: save res to state
                actions.setSubmitting(false);
              } catch (error) {
                actions.setSubmitting(false);
                this.setState({ errors: [...this.state.errors, error] });
              }
            }}
            render={({ isSubmitting }) => (
              <Form>
                <Field type="number" name="pageStart" />
                <Field type="number" name="pageEnd" />
                <button type="submit" className="button" disabled={isSubmitting}>Start scrapping</button>
              </Form>
            )}
          />
        </div>
      </div>
    );
  }
}

export default Scrapper;
