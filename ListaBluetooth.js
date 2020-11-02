import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Image, ToastAndroid, Alert} from 'react-native';
import {
  Button,
  List,
  Switch,
  ActivityIndicator,
  Colors,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import BluetoothSerial from 'react-native-bluetooth-serial-next';
import {Buffer} from 'buffer';
import {useAppContext} from './Context';

global.Buffer = Buffer;

function Bluetooth() {
  const [dispositivos, setDispositivos] = useState([]);
  const [encender, setEncender] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [texto, setTexto] = useState('Escoja pulsera');

  const navigate = useNavigation();
  const {setIdDevice} = useAppContext();
  const {isConected} = useAppContext();
  const {conected} = useAppContext();

  const onToggleSwitch = () => {
    if (!encender) {
      return habilitarBluetooth();
    }
    deshabilitarBluetooth();
  };

  const habilitarBluetooth = async () => {
    await BluetoothSerial.requestEnable();
    const lista = await BluetoothSerial.list();
    await BluetoothSerial.stopScanning();
    setDispositivos(lista);
    setEncender(true);
  };

  const deshabilitarBluetooth = async () => {
    await BluetoothSerial.disable();
    await BluetoothSerial.stopScanning();
    setEncender(false);
  };

  const Emparejar = async (dispositivo) => {
    try {
      if (dispositivo.name === 'Weareable-Oximeter') {
        setConectando(true);
        setTexto('Esperando pulsera...');

        const conectado = await BluetoothSerial.device(
          dispositivo.id,
        ).connect();

        if (conectado) {
          ToastAndroid.show('Conectado', ToastAndroid.SHORT);
          setConectando(false);
          setTexto('Conectado');
          isConected(true);
          setIdDevice(dispositivo.id);
          navigate.navigate('Usuarios');
        } else {
          ToastAndroid.show(
            'Hubo un problema en la conexion',
            ToastAndroid.SHORT,
          );
          setConectando(false);
        }
      } else {
        ToastAndroid.show('No es un dispositivo valido', ToastAndroid.SHORT);
        setConectando(false);
      }
    } catch (e) {
      setConectando(false);
      Alert.alert(
        'Tiempo de espera agotado',
        'Presione OK para volver a intentarlo',
      );
      ToastAndroid.show('Error de conexión', ToastAndroid.SHORT);
      console.log(e);
    }
  };

  const Mapeo = () => {
    if (conectando) {
      return (
        <View style={{alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator
            animating={true}
            color={Colors.red800}
            size={'large'}
          />
        </View>
      );
    } else {
      return dispositivos.map((val, index) => (
        <View key={index} style={{padding: 10}}>
          <Button
            color="#C1CBF4"
            compact={true}
            mode="contained"
            onPress={() => {
              Emparejar(val);
            }}>
            <Text>{val.name}</Text>
          </Button>
          <Separator />
        </View>
      ));
    }
  };

  const Separator = () => <View style={styles.separator} />;

  const Encender = () => {
    if (conectando) {
      return <Text>Intentando contectar...</Text>;
    } else {
      return (
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Switch
            color="#E82121"
            value={encender}
            onValueChange={onToggleSwitch}
          />
        </View>
      );
    }
  };

  const Emparejado = () => {
    if (conected) {
      return (
        <View style={styles.container}>
          <Text style={{fontSize: 30}}>Ya estas emparejado!</Text>
          <Separator />
          <Text style={{fontSize:15}}>Apagar bluetooth.</Text>
          <Switch
            color="#E82121"
            value={encender}
            onValueChange={onToggleSwitch}
          />
          <Button
            color="#C1CBF4"
            compact={true}
            mode="contained"
            onPress={() => navigate.navigate('Usuarios')}>
            <Text>Regresar</Text>
          </Button>
        </View>
      );
    } else {
      return (
        <View style={styles.container}>
          <Text>Bluetooth Encendido</Text>
          <Encender />
          <List.Section
            style={{
              margin: 10,
              borderWidth: 0.5,
              backgroundColor: '#F1EFEF',
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
            }}>
            <List.Subheader style={{fontSize: 20}}>{texto}</List.Subheader>
            <Mapeo />
          </List.Section>
        </View>
      );
    }
  };

  return !encender ? (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
      }}>
      <Text>Encender Bluetooth</Text>
      <Encender />

      <Image
        source={require('./android.png')}
        style={{
          height: 250,
          width: 250,
          resizeMode: 'contain',
        }}></Image>
      <Button
        color="#C1CBF4"
        compact={true}
        mode="contained"
        onPress={() => navigate.navigate('Usuarios')}>
        <Text>Continuar sin conecar la pulsera</Text>
      </Button>
    </View>
  ) : (
    <Emparejado />
  );
}

const styles = StyleSheet.create({
  scrollView: {
    marginHorizontal: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginVertical: 8,
    fontSize: 30,
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  separator: {
    marginVertical: 8,
    borderBottomColor: '#737373',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  containerValue: {
    backgroundColor: '#ff7550',
    borderRadius: 8,
    elevation: 6,
  },
});

export default Bluetooth;
