import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ToastAndroid,
} from 'react-native';
import {
  Provider as PaperProvider,
  ActivityIndicator,
  Colors,
  Button,
  List,
  DefaultTheme,
  configureFonts,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import BluetoothSerial from 'react-native-bluetooth-serial-next';
import {Buffer} from 'buffer';
import {useAppContext} from './Context';
import DeviceInfo from 'react-native-device-info';

const abortController = new AbortController();
const signal = abortController.signal;
let isMounted = false;

const Usuarios = ({navigation}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigation();
  const {idDevice} = useAppContext();

  const getData = async () => {
    write(idDevice, 'T');
    isMounted = true;
    await fetch(
      'http://192.168.1.11:8069/api/datos/' + DeviceInfo.getUniqueId(),
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
          setData(responseJson.valor);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (error) {
          console.log(error);
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
    const unsubscribe = navigate.addListener('focus', async () => {
      await getData();
      
    });
    //write(idDevice, 'T');
    return unsubscribe;
  }, [navigate]);

  const Separator = () => <View style={styles.separator} />;

  const write = (id, data) => {
    if (typeof data === 'string') {
      const qq = new Buffer(data);
      console.log(Buffer.from(data).toString('base64'));
    }
    return BluetoothSerial.writeToDevice(
      Buffer.from(data).toString('base64'),
      id,
    );
  };

  const Mapeo = () => {
    return data.map((val, index) => (
      <View key={index} style={{padding: 10}}>
        <Button
          color="#C1CBF4"
          compact={true}
          mode="contained"
          onPress={() => navigate.navigate('Datos', val)}>
          <Text>{val.nombre}</Text>
        </Button>
        <Separator />
      </View>
    ));
  };

  const theme = {
    roundness: 2,
    ...DefaultTheme,
    fonts: configureFonts(fontConfig),
    ...DefaultTheme.colors,
    colors: {
      primary: '#3498db',
      accent: '#f1c40f',
    },
  };
  const fontConfig = {
    default: {
      regular: {
        fontFamily: 'sans-serif',
        fontWeight: 'normal',
      },
      medium: {
        fontFamily: 'sans-serif-medium',
        fontWeight: 'normal',
      },
      light: {
        fontFamily: 'sans-serif-light',
        fontWeight: 'normal',
      },
      thin: {
        fontFamily: 'sans-serif-thin',
        fontWeight: 'normal',
      },
    },
  };

  return loading ? (
    <PaperProvider theme={theme}>
      <Image
        style={{resizeMode: 'stretch', width: 1000, height: 120}}
        source={{
          uri: 'https://www.uta.edu.ec/v3.2/uta/images/header.png',
        }}
      />
      <View style={{flex: 1, justifyContent: 'center'}}>
        <ActivityIndicator
          animating={true}
          color={Colors.red800}
          size={'large'}
        />
      </View>
    </PaperProvider>
  ) : (
    <View>
      <View>
        <Image
          style={{resizeMode: 'stretch', width: 1000, height: 120}}
          source={{
            uri: 'https://www.uta.edu.ec/v3.2/uta/images/header.png',
          }}
        />
      </View>
      <View style={{height: 300}}>
        <ScrollView style={styles.scrollView}>
          <List.Section
            style={{
              margin: 100,
              borderWidth: 0.5,
              backgroundColor: '#F1EFEF',
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
            }}>
            <List.Subheader style={{fontSize: 20}}>
              Seleccione su usuario.
            </List.Subheader>
            <Mapeo />
          </List.Section>
        </ScrollView>
      </View>
      <View style={{alignSelf: 'center'}}>
        <Button
          compact={true}
          mode="contained"
          color="#C1CBF4"
          onPress={() => navigation.navigate('Crear', (id = {}))}>
          <Text>Crear usuario</Text>
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    marginHorizontal: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 16,
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

export default Usuarios;
