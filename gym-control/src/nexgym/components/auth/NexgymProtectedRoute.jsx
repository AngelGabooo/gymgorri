// src/nexgym/components/auth/NexgymProtectedRoute.jsx

import React from 'react';

import {
  Navigate,
  useLocation
} from 'react-router-dom';

import {
  getCurrentNexgymAdminSession
} from '../../services/nexgymAdminAuthService';


const NexgymProtectedRoute = ({
  children
}) => {

  const location =
    useLocation();


  const session =
    getCurrentNexgymAdminSession();


  if (!session) {

    return (

      <Navigate
        to="/nexgym/login"
        replace
        state={{
          from:
            location.pathname
        }}
      />

    );

  }


  if (
    session.role !==
    'super_admin'
  ) {

    return (

      <Navigate
        to="/nexgym/login"
        replace
      />

    );

  }


  return children;

};


export default NexgymProtectedRoute;