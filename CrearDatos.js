import React, {useEffect, useState} from 'react';
import {
  TextInput,
  Card,
  Avatar,
  Button,
  Text,
  HelperText,
} from 'react-native-paper';
import {StyleSheet, View, Alert} from 'react-native';
import TextInputMask from 'react-native-text-input-mask';
import {validate} from './validate';
import {useNavigation} from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';

const NuevoPaciente = ({route}) => {
  const navigation = useNavigation();
  const [datos, setDatos] = useState({
    edad: '',
    edadError: '',
    nombre: '',
    nombreError: '',
    boton: 'Crear',
    mensaje: 'Usuario Creado',
    borrar: false,
  });

  useEffect(() => {
    const Editar = () => {
      if (route.params.id) {
        setDatos({
          edad: route.params.edad,
          edadError: '',
          nombre: route.params.nombre,
          nombreError: '',
          boton: 'Modificar',
          mensaje: 'Usuario Modificado',
          borrar: true,
        });
      }
    };
    Editar();
  }, []);

  const constraints = {
    edad: {
      presence: {
        allowEmpty: false,
        message: 'La edad no debe estar vacia',
      },
    },
    nombre: {
      presence: {
        allowEmpty: false,
        message: 'El nombre no debe estar vacio',
      },
    },
  };

  const validateFields = (tipo, valor) => validate(tipo, valor, constraints);

  const crearPaciente = async () => {
    let id = {};
    if (route.params.id) {
      id = {id: route.params.id};
    }
    const values = {
      ...id,
      name: datos.nombre,
      edad: datos.edad,
      idDispositivo: DeviceInfo.getUniqueId(),
    };
    await fetch(
      !route.params.id
        ? 'http://192.168.1.11:8069/api/crear_usuario/'
        : 'http://192.168.1.11:8069/api/modificar_usuario',
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: !route.params.id ? 'POST' : 'PUT',
        body: JSON.stringify(values),
      },
    )
      .then((response) => response.json())
      .then((responseJson) => {
        !route.params.id
          ? navigation.navigate('Usuarios')
          : navigation.navigate('Datos');
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

  const User = (props) => (
    <Avatar.Image
      size={40}
      source={{
        uri:
          'https://www.psybooks.com/wp-content/uploads/psybooks-user-accounts.png',
      }}
    />
  );
  const Medico = (props) => (
    <Avatar.Image
      size={40}
      source={{
        uri:
          'https://image.freepik.com/vector-gratis/ilustracion-clinica-doctor_1270-69.jpg',
      }}
    />
  );

  const borrarUsuario = async () => {
    await fetch('http://192.168.1.11:8069/api/borrar', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({id: route.params.id}),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        navigation.navigate('Usuarios');
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

  const Borrar = (props) =>
    datos.borrar ? (
      <Button
        compact={true}
        color="#5AADF1"
        mode="contained"
        onPress={() =>
          Alert.alert(
            'Alerta',
            'Desde eliminar este usuario?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {text: 'Aceptar', onPress: async () => await borrarUsuario()},
            ],
            {cancelable: false},
          )
        }>
        <Text>Borrar usuario</Text>
      </Button>
    ) : (
      <Text></Text>
    );

  const Separator = () => <View style={styles.separator} />;

  return (
    <View style={{flexDirection: 'column'}}>
      <View style={{flexDirection: 'row'}}>
        <Card
          style={{
            flex: 1,
            padding: 50,
          }}>
          <Card.Title
            title="Ingrese sus datos"
            left={User}
            subtitle="Seleccione los campos con el puntero para poder modificarlos."
          />
          <TextInput
            render={(props) => <TextInputMask {...props} mask="[99]" />}
            style={{backgroundColor: 'transparent'}}
            placeholder="Ingrese su edad"
            maxLength={2}
            label="Edad"
            mode={'outlined'}
            error={datos.edadError !== '' && datos.edadError !== null}
            underlineColor="blue"
            value={datos.edad}
            onChangeText={(text) =>
              setDatos({
                ...datos,
                edad: text,
                edadError: validateFields('edad', text),
              })
            }
          />
          <HelperText
            type="error"
            visible={datos.edadError !== '' && datos.edadError !== null}>
            {datos.edadError}
          </HelperText>
          <TextInput
            placeholder="Ingrese su nombre"
            style={{backgroundColor: 'transparent'}}
            label="Nombre paciente"
            mode={'outlined'}
            error={datos.nombreError !== '' && datos.nombreError !== null}
            underlineColor="blue"
            value={datos.nombre}
            onChangeText={(text) =>
              setDatos({
                ...datos,
                nombre: text,
                nombreError: validateFields('nombre', text),
              })
            }
          />
          <HelperText
            type="error"
            visible={datos.nombreError !== '' && datos.nombreError !== null}>
            {datos.nombreError}
          </HelperText>
        </Card>
      </View>
      <Button
        compact={true}
        color="#5AADF1"
        mode="contained"
        onPress={crearPaciente}>
        <Text>{datos.boton}</Text>
      </Button>
      <Separator />
      <Borrar />
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

export default NuevoPaciente;
