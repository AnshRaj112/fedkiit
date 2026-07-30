"use client";

import React, { createContext, useState, useEffect } from 'react';

export const RecoveryContext = createContext();

const initialContext = {
  email: '',
  otp: '',
  teamCode: '',
  teamName: '',
  successMessage: ''
};

const RecoveryContextProvider = ({ children }) => {
  // The original seeded this from localStorage inside the useState initialiser.
  // That runs during server rendering under Next.js, where localStorage does not
  // exist, so the stored values are restored in a mount effect instead.
  const [state, setState] = useState(initialContext);

  useEffect(() => {
    const storedEmail = localStorage.getItem('recoveryEmail') || '';
    const storedOTP = localStorage.getItem('recoveryOTP') || '';
    if (storedEmail || storedOTP) {
      setState(prevState => ({
        ...prevState,
        email: storedEmail,
        otp: storedOTP,
      }));
    }
  }, []);

  const setEmail = (newEmail) => {
    localStorage.setItem('recoveryEmail', newEmail);
    setState(prevState => ({ ...prevState, email: newEmail }));
  };

  const setOTP = (newOTP) => {
    localStorage.setItem('recoveryOTP', newOTP);
    setState(prevState => ({ ...prevState, otp: newOTP }));
  };

  const setTeamCode = (newTeamCode) => {
    setState(prevState => ({ ...prevState, teamCode: newTeamCode }));
  };

  const setTeamName = (newTeamName) => {
    setState(prevState => ({ ...prevState, teamName: newTeamName }));
  };

  // useEffect(() => {
  //   return () => {
  //     localStorage.removeItem('recoveryEmail');
  //     localStorage.removeItem('recoveryOTP');
  //   }
  // }, []);

  const setSuccessMessage = (newMessage) => {
    setState(prevState => ({ ...prevState, successMessage: newMessage }));
  }

  return (
    <RecoveryContext.Provider value={{ ...state, setEmail, setOTP, setTeamCode, setTeamName, setSuccessMessage }}>
      {children}
    </RecoveryContext.Provider>
  );
};

export default RecoveryContextProvider;