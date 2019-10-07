import React, { Component } from "react";
import { Link, navigate } from "@reach/router"

import "bootstrap/dist/css/bootstrap.css";

import Navbar from 'react-bootstrap/Navbar';
import Nav from "react-bootstrap/Nav";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

class AppNavbar extends Component {
  render() {
    return (
		<Navbar id='navbar' bg="info" variant="dark" expand="md" fixed="top">
		  <Navbar.Brand as={Link} to="/">Batchman</Navbar.Brand>
		  <Navbar.Toggle aria-controls="basic-navbar-nav" />
		  <Navbar.Collapse id="basic-navbar-nav" className="d-flex justify-content-sm-between">
		    <div>
		    	<Nav className="mr-auto">
		      	{/*<Nav.Link href="#home">Home</Nav.Link>
		      	<Nav.Link href="#link">Link</Nav.Link>*/}
		    	</Nav>
		    </div>
			<div></div>
		  </Navbar.Collapse>
		</Navbar>
    );
  }
}

export default AppNavbar;