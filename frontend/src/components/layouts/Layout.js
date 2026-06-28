// src/components/layouts/Layout.js
// NOTE: Layout.js is NOT used in App.js — routing is handled directly there.
// This file is kept in case you need a wrapper for non-admin pages (e.g. Login).
// If you do use it, import the CSS normally (not as CSS Modules).

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="container">
      <Sidebar />
      <div className="mainContent">
        <Header />
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;