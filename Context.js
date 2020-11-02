import React, {useContext, useState, createContext} from 'react';

const AppContext = createContext({
  idDevice: '',
  setIdDevice: () => {},
  conected: false,
  isConected: () => {},
});

export const AppProvider = (props) => {
  const [idDevice, setIdDevice] = useState('');
  const [conected, isConected] = useState(false);

  return (
    <AppContext.Provider
      value={{
        idDevice,
        setIdDevice,
        conected,
        isConected,
      }}>
      {props.children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
