import React, { Component, EventHandler } from 'react';
import { Link } from 'react-router-dom';

class Head extends Component {
  state = {
    isBurgerActive: false,
    burgerClasses: 'navbar-burger burger',
    navMenuClasses: 'navbar-menu',
  };

  activateBurger = () => {
    console.log('Activated');
    if (!this.state.isBurgerActive) {
      this.setState({
        isBurgerActive: true,
        burgerClasses: 'navbar-burger burger is-active',
        navMenuClasses: 'navbar-menu is-active',
      });
    } else {
      this.deactivateBurger();
    }  
  };

  deactivateBurger = () => {
    console.log('Deactivated');
    this.setState({
      isBurgerActive: false,
      burgerClasses: 'navbar-burger burger',
      navMenuClasses: 'navbar-menu',
    });
  };

  render() {
    return (
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link to="/" className="navbar-item">
            Main page
          </Link>
          <a
            onClick={this.activateBurger}
            onBlur={this.deactivateBurger}
            className={this.state.burgerClasses}
            role="button"
            aria-label="menu"
            aria-expanded="false"
            data-target="navbar"
          >
            <span area-hidden="true" />
            <span area-hidden="true" />
            <span area-hidden="true" />
          </a>
        </div>
        <div id="navbar" className={this.state.navMenuClasses}>
          <div className="navbar-start">
            <Link to="/scrapper" className="navbar-item">
              Go to scrapping
            </Link>
          </div>
        </div>
      </nav>
    );
  }
}

export default Head;
