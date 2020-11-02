import React, {useEffect, useRef, useState} from 'react';

import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import {useNavigation} from '@react-navigation/native';

import {Alert, ToastAndroid, AppState} from 'react-native';

import NuevoPaciente from './CrearDatos';
import Datos from './DatosPaciente';
import Usuarios from './ListaUsuarios';
import Bluetooth from './ListaBluetooth';
import {AppProvider, useAppContext} from './Context';
import BluetoothSerial from 'react-native-bluetooth-serial-next';
import Splash from './SplashScreen';
import Sound from 'react-native-sound';
import DeviceInfo from 'react-native-device-info';
import Grafica from './Grafica'

var done = new Sound('done.mp3', Sound.MAIN_BUNDLE, (error) => {
  if (error) {
    console.log('failed to load the sound', error);
    return;
  }
});

const Lista = ({navigation}) => {
  const {isConected} = useAppContext();
  const {conected} = useAppContext();
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    const ws = new WebSocket('ws://18.222.17.116:8701', {
      transports: ['websocket'],
    });

    ws.onopen = () => {
      console.log('conectado');
    };
    ws.onerror = () => {
      console.log('error conectado');
    };
    ws.onmessage = (mensaje) => {
      const mensaje_decodificado = Buffer.from(mensaje.data, 'base64').toString(
        'ascii',
      );
      const mensaje_json = JSON.parse(mensaje_decodificado);
      if (mensaje_json.dispositivo === DeviceInfo.getUniqueId()) {
        done.play();
        ToastAndroid.showWithGravityAndOffset(
          mensaje_json.titulo +
            '\r\n' +
            '─────────────────────────────────' +
            '\r\n' +
            'El paciente ' +
            ' ☻ ' +
            mensaje_json.paciente +
            '\r\n' +
            mensaje_json.mensaje,
          ToastAndroid.LONG,
          ToastAndroid.TOP,
          500,
          0,
        );
      }
    };
  }, []);

  useEffect(() => {
    ActivacionAlerta();
  }, []);

  useEffect(() => {
    AppState.addEventListener('change', _handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', _handleAppStateChange);
    };
  }, []);

  const _handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      setAppStateVisible(appState.current);
    }
    appState.current = nextAppState;
  };

  const ActivacionAlerta = () => {
    BluetoothSerial.on('connectionLost', ({device}) => {
      if (device && appState.current == 'active') {
        console.log('Presionado');
        Alert.alert(
          '¡Desconexión!',
          'La pulsera se ha desconectado/apagado. ¿Volver a conectarlo ahora?',
          [
            {
              text: 'NO',
              onPress: () => {
                isConected(false);
                BluetoothSerial.removeAllListeners = (eventName) =>
                  DeviceEventEmitter.removeAllListeners(eventName);
              },
            },
            {
              text: 'SI',
              onPress: () => {
                navigation.navigate('Home');
                isConected(false);
                BluetoothSerial.removeAllListeners = (eventName) =>
                  DeviceEventEmitter.removeAllListeners(eventName);
              },
            },
          ],
          {cancelable: false},
        );
      } else if (device && appState.current == 'background') {
        isConected(false);
        done.play();
        console.log('cambio');
        ToastAndroid.showWithGravityAndOffset(
          'Se ha perdido la conexión' +
            '\r\n' +
            '─────────────────────────────────' +
            '\r\n' +
            'La pulsera Weareable se ha apagado/desconectado' +
            '  ☹  .' +
            '\r\n' +
            'Vuelva a abrir la aplicación para conectarla.',
          ToastAndroid.LONG,
          ToastAndroid.TOP,
          500,
          0,
        );
        /*BluetoothSerial.removeAllListeners = (eventName) =>
          DeviceEventEmitter.removeAllListeners(eventName);*/
      }
    });
  };
  return <Bluetooth />;
};

const Stack = createStackNavigator();

function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen
            name="Home"
            component={Lista}
            options={{title: 'Bluetooth'}}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Splash"
            component={Splash}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Usuarios"
            component={Usuarios}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Crear"
            component={NuevoPaciente}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Datos"
            component={Datos}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Grafica"
            component={Grafica}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}

export default App;
