import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { FaRegBell } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import "bootstrap/dist/css/bootstrap.min.css";
import "./MyNavbar.css";
import logo from "../../../assets/Logo.svg";
import { Link } from "react-router-dom";

export default function MyNavbar() {
  return (
    <>
      <Navbar expand="lg" className="px-4">
        <Container
          fluid
          className="d-flex justify-content-between align-items-center"
        >
          <Navbar.Brand href="#">
            <img src={logo} alt="StreamVibe" />
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="links ms-auto">
              <Nav.Link as={Link} to="/">
                Home
              </Nav.Link>
              <Nav.Link as={Link} to="/movies_shows">
                Movies & Shows
              </Nav.Link>
              <Nav.Link as={Link} to="/support">
                Support
              </Nav.Link>
              <Nav.Link as={Link} to="/subscription">
                Subscriptions
              </Nav.Link>
            </Nav>

            <Nav className="ms-auto">
              <Nav.Link href="#search">
                <IoIosSearch size={25} />
              </Nav.Link>
              <Nav.Link href="#notifications">
                <FaRegBell size={18} />
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}
