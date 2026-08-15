// src/components/Layout/ProtectedRoute.jsx

import React from 'react';

import {
  Navigate
} from 'react-router-dom';

import {
  canAccess,
  getCurrentSession,
  getFirstAllowedRoute
} from '../../services/authService';


const ProtectedRoute = ({
  children,
  permission
}) => {

  const session =
    getCurrentSession();


  if (!session) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  if (
    permission &&
    !canAccess(
      permission
    )
  ) {

    return (
      <Navigate
        to={
          getFirstAllowedRoute(
            session
          )
        }
        replace
      />
    );

  }


  return children;

};


export default ProtectedRoute;
