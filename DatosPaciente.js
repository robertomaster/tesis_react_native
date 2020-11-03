import React, {useEffect, useState, useRef, memo} from 'react';
import {
  ActivityIndicator,
  Card,
  Avatar,
  Button,
  Text,
  Colors,
} from 'react-native-paper';
import {
  View,
  Alert,
  StyleSheet,
  Image,
  AppState,
  ToastAndroid,
} from 'react-native';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import BluetoothSerial from 'react-native-bluetooth-serial-next';
import {Buffer} from 'buffer';
import {useAppContext} from './Context';
import Sound from 'react-native-sound';
import BackgroundService from 'react-native-background-actions';

const abortController = new AbortController();
const signal = abortController.signal;
let isMounted = true;

var done = new Sound('done.mp3', Sound.MAIN_BUNDLE, (error) => {
  if (error) {
    console.log('failed to load the sound', error);
    return;
  }
});

const Datos = ({navigation, route}) => {
  const [data, setData] = useState({
    id: route.params.id,
    nombre: '',
    edad: '',
  });
  const [signos, setSignos] = useState({
    presion: 0,
    oxigeno: 0,
    contador: 0,
  });
  const [loading, setLoading] = useState(true);
  const {idDevice} = useAppContext();
  const {conected} = useAppContext();
  const appState = useRef(AppState.currentState);
  const navigate = useNavigation();
  const isfocus = useIsFocused();
  const [mensaje, setMensaje] = useState('');
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const [medido, setMedido] = useState(false);

  const options = {
    taskName: 'Leer',
    taskTitle: 'Medicion de datos',
    taskDesc: 'Se sigue con la medicion de datos.',
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: 'red',
    linkingURI: 'exampleScheme://chat/jane',
    parameters: {
      delay: 1000,
    },
  };

  useEffect(() => {
    if (isfocus) {
      isMounted = true;
    }
    if (medido && appState.current == 'background') {
      detenerBack();
      done.play();
      ToastAndroid.showWithGravityAndOffset(
        'Se ha terminado la medicion' +
          '\r\n' +
          '─────────────────────────────────' +
          '\r\n' +
          'BPMS: ' +
          signos.presion +
          ' ♥. SpO2: ' +
          signos.oxigeno +
          '  ◙.' +
          '\r\n' +
          'Los datos se han subido a la plataforma.',
        ToastAndroid.LONG,
        ToastAndroid.TOP,
        500,
        0,
      );
      setMedido(false);
    }
  }, [isfocus, medido]);

  useEffect(() => {
    const unsubscribe = navigate.addListener('focus', async () => {
      await getMensaje();
      await getData();
      await BluetoothSerial.clear();
    });
    return unsubscribe;
  }, [navigate]);

  const getData = async () => {
    await fetch('http://18.222.17.116:8069/api/paciente/' + route.params.id, {
      headers: {
        Accept: 'application/json',
      },
      signal: signal,
      method: 'GET',
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (isMounted) {
          setData(responseJson.valor);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (error) {
          Alert.alert(
            '¡Error! ☹ Tiempo de espera agotado',
            'No se ha podido realizar la conexion al servidor. Revise su conexion a internet y vuelva a intentarlo.',
            [
              {
                text: 'OK',
              },
            ],
          );
        }
      });
  };

  const getMensaje = async () => {
    await fetch(
      'http://18.222.17.116:8069/api/prescripcion/' + route.params.id,
      {
        headers: {
          Accept: 'application/json',
        },
        signal: signal,
        method: 'GET',
      },
    )
      .then((response) => response.json())
      .then((responseJson) => {
        if (isMounted) {
          setMensaje(responseJson.mensaje);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (error) {
          Alert.alert(
            '¡Error! ☹ Tiempo de espera agotado',
            'No se ha podido realizar la conexion al servidor. Revise su conexion a internet y vuelva a intentarlo.',
            [
              {
                text: 'OK',
              },
            ],
          );
        }
      });
  };

  useEffect(() => {
    write(idDevice, route.params.nombre);
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', async () => {
      isMounted = false;
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    AppState.addEventListener('change', _handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', _handleAppStateChange);
    };
  }, []);

  useEffect(() => {
    TareaBack();
    return async () => await BackgroundService.stop();
  }, []);

  const _handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      setAppStateVisible(appState.current);
    }
    appState.current = nextAppState;
  };

  const TareaBack = async () => {
    try {
      await BackgroundService.start(read, options);
    } catch (e) {
      console.log('Error', e);
    }
  };

  const detenerBack = async () => {
    await BackgroundService.stop();
  };

  const read = ({}) => {
    BluetoothSerial.readEvery(
      (data, intervalId) => {
        console.log(data);
        var arrayDeCadenas = data.split(',');
        for (var i = 0; i < arrayDeCadenas.length; i++) {
          arrayDeCadenas[i];
        }
        if (arrayDeCadenas[1] == undefined) {
          setSignos({
            ...signos,
            presion: 0,
            oxigeno: 0,
          });
        } else {
          setSignos({
            ...signos,
            presion: arrayDeCadenas[0],
            oxigeno: arrayDeCadenas[1],
            contador: arrayDeCadenas[2],
          });
        }

        if (arrayDeCadenas[2] == 59) {
          setMedido(true);
          enviarDatos(arrayDeCadenas[0], arrayDeCadenas[1]);
          Alert.alert(
            'Se ha completado la medicion',
            'Los datos se enviaron al servidor y se enviara una prescripcion en caso de ser necesaria.',
            [
              {
                text: 'OK',
              },
            ],
          );
        }
        if ((!isMounted && intervalId) || arrayDeCadenas[2] == 59) {
          clearInterval(intervalId);
        }
      },
      1000,
      '\r\n',
    );
  };

  const write = (id, nombre) => {
    if (typeof nombre === 'string') {
      const qq = new Buffer(nombre);
      console.log(Buffer.from(nombre).toString('base64'));
    }
    return BluetoothSerial.writeToDevice(
      Buffer.from(nombre).toString('base64'),
      id,
    );
  };

  const enviarDatos = async (presion, oxigeno) => {
    const values = {
      res_paciente: route.params.id,
      presion: parseInt(presion),
      oxigeno: parseInt(oxigeno),
    };
    console.log(values)
    await fetch('http://18.222.17.116:8069/api/datosPaciente', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(values),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log('enviado');
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const User = (props) => (
    <Avatar.Image
      size={40}
      source={{
        uri:
          'https://www.psybooks.com/wp-content/uploads/psybooks-user-accounts.png',
      }}
    />
  );
  const Separator = () => <View style={styles.separator} />;

  const renderData = (type, val) => (
    <View>
      <Text
        style={{
          textAlign: 'center',
          fontSize: 30,
          marginVertical: 15,
        }}>
        {`${val} ${type === 'presion' ? 'bpm' : '%SpO2'}`}
      </Text>
    </View>
  );
  const LeftContent = (props) => (
    <Avatar.Image
      size={40}
      source={{
        uri:
          'https://health.clevelandclinic.org/wp-content/uploads/sites/3/2020/01/mildHeartAttack-866257238-770x553.jpg',
      }}
    />
  );

  const Midiendo = () => {
    return signos.contador > 0 ? (
      <View>
        <Text style={{color: 'green', fontSize: 20}}>
          Midiendo.... {signos.contador}
        </Text>
        <Text style={{color: 'green', fontSize: 20}}>
          ¡Atencion! La medicion se desarrolla mientras esta pantalla este
          activa.
        </Text>
      </View>
    ) : (
      <Text>Coloquese la pulsera</Text>
    );
  };

  return loading ? (
    <View style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
      <ActivityIndicator
        animating={true}
        color={Colors.red800}
        size={'large'}
      />
    </View>
  ) : (
    <View
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
      }}>
      <Image
        style={{resizeMode: 'stretch', width: 1000, height: 120}}
        source={{
          uri: 'https://www.uta.edu.ec/v3.2/uta/images/header.png',
        }}
      />
      <View style={{flexDirection: 'row', backgroundColor: '#fff'}}>
        <Card
          style={{
            flex: 1,
            flexDirection: 'row',
          }}>
          <Card.Title
            title="Signos vitales"
            subtitle="Medidos en tiempo real"
            left={LeftContent}
          />
          <View>
            <Text style={{fontSize: 20}}>
              Su ritmo cardiaco en bpm (batidos por minuto).
            </Text>
            {renderData('presion', signos.presion)}
            <Text style={{fontSize: 20}}>
              Su nivel de oxigeno en la sangre.
            </Text>
            {renderData('oxigeno', signos.oxigeno)}
          </View>
        </Card>
        <View>
          <View
            style={{
              flex: 1,
              paddingLeft: 40,
              backgroundColor: '#fff',
              justifyContent: 'center',
              flexDirection: 'row',
            }}>
            <Card>
              <Card.Title
                title="Datos"
                subtitle="Pulse el boton 'Editar Datos' para editar los datos"
                left={User}
              />
              <Text style={{fontSize: 20}}>
                Nombre del paciente: {data.nombre}
              </Text>
              <Separator />
              <Text style={{fontSize: 20}}>Edad del paciente: {data.edad}</Text>
              <Separator />
              <Text style={{fontSize: 20}}>Última prescripción: {mensaje}</Text>
            </Card>
          </View>
        </View>
      </View>
      <View style={{flexDirection: 'row'}}>
        <Card style={{padding: 20, flex: 1}}>
          <Text style={{color: !conected ? 'red' : 'blue'}}>{`${
            !conected ? 'PULSERA DESCONECTADA' : 'PULSERA CONECTADA'
          }`}</Text>
          <Midiendo />
        </Card>
        <Card style={{padding: 20, flex: 1}}>
          <Button
            compact={true}
            color="#C1CBF4"
            mode="contained"
            onPress={() => navigate.navigate('Grafica', data.id)}>
            <Text>Grafico y Notificaciones</Text>
          </Button>
        </Card>
        <Card style={{padding: 20, flex: 1}}>
          <Button
            compact={true}
            color="#C1CBF4"
            mode="contained"
            onPress={() => navigate.navigate('Crear', data)}>
            <Text>Editar datos</Text>
          </Button>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  separator: {
    marginVertical: 8,
    borderBottomColor: '#737373',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default Datos;
