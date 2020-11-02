import React, {useEffect, useState} from 'react';
import {View, Image,Alert} from 'react-native';
import {Dimensions} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {ActivityIndicator, Colors} from 'react-native-paper';
import DeviceInfo from 'react-native-device-info';



const Splash = () => {
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(async () => {
      await idDispositivo();
    }, 3000);
  }, []);

  const idDispositivo = async () => {
    const values = {
      codigo: DeviceInfo.getUniqueId(),
    };
    await fetch('http://192.168.1.11:8069/api/splash', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(values),
    })
      .then((response) => response.json())
      .then((responseJson) => {
          if(responseJson.result.success){
            navigation.replace('Home');
          }
      })
      .catch((error) => {
        Alert.alert(
          '¡Error! ☹ Tiempo de espera agotado',
          'No se ha podido realizar la conexion al servidor. Revise su conexion a internet y vuelva a intentarlo.',
          [
            {
              text: 'OK',
            },
          ],
        );
        console.log(error);
      });
  };

  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      <View style={{flex: 1, justifyContent: 'center', alignSelf: 'stretch'}}>
        <Image
          style={{
            width: Math.round(windowWidth),
            height: Math.round(windowHeight),
            resizeMode: 'stretch',
          }}
          source={require('./splash.jpg')}
        />
      </View>
      <View
        style={{
          justifyContent: 'flex-end',
          alignSelf: 'center',
          marginBottom: 40,
        }}>
        <ActivityIndicator
          animating={true}
          color={Colors.red800}
          size={'large'}
        />
      </View>
    </View>
  );
};

export default Splash;
