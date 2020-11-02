import {
  View,
  Text,
  Alert,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {LineChart} from 'react-native-chart-kit';
import {
  Provider as PaperProvider,
  Button,
  ActivityIndicator,
  Colors,
  Badge,
  List,
} from 'react-native-paper';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import moment from 'moment';

const Grafica = ({navigation, route}) => {
  const navigate = useNavigation();
  const windowWidth = Dimensions.get('window').width;
  const [grafica, setGrafica] = useState(true);
  const [prescripciones, setPrescripciones] = useState(false);
  const [datos, setDatos] = useState();
  const [fechaInicio, setInicio] = useState(
    moment(moment(new Date()).subtract(7, 'day'), 'America/Guayaquil'),
  );
  const [fechaFinal, setFinal] = useState(
    moment(new Date(), 'America/Guayaquil'),
  );
  const [noti, setNoti] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getDatosGrafica();
  }, []);

  const getDatosGrafica = async () => {
    await fetch('http://192.168.1.11:8069/api/grafica', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        res_paciente: route.params,
        start_date: new Date(
          moment(fechaInicio).set({h: 0, m: 0}),
        ).toISOString(),
        end_date: new Date(
          moment(fechaFinal).set({h: 23, m: 59}),
        ).toISOString(),
      }),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        setNoti(responseJson.result.notificacion);
        if (
          Array.isArray(responseJson.result.data.labels) &&
          responseJson.result.data.labels.length === 0
        ) {
          setDatos({
            labels: ['0'],
            datasets: [
              {
                id: 1,
                data: [0],
              },
              {
                id: 2,
                data: [0],
              },
            ],
            legend: ['No hay datos para mostrar'], // optional
          });
        } else {
          setDatos({
            labels: responseJson.result.data.labels,
            datasets: [
              {
                id: responseJson.result.data.datasets[0].id,
                data: responseJson.result.data.datasets[0].data,
                color: (opacity = 1) => `rgba(17, 112, 201, ${opacity})`,
              },
              {
                id: responseJson.result.data.datasets[1].id,
                data: responseJson.result.data.datasets[1].data,
                color: (opacity = 1) => `rgba(201, 17, 17 ,  ${opacity})`,
              },
            ],
            legend: ['SpO2','BPMs'], // optional
          });
        }
        setCargando(false);
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

  const notiLeido = async () => {
    const values = {
      res_paciente: route.params,
    };
    await fetch('http://192.168.1.11:8069/api/actNoti', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      body: JSON.stringify(values),
    })
      .then((response) => response.json())
      .then((responseJson) => {})
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

  const Renderizado = () => {
    if (grafica) {
      return (
        <View>
          <LineChart
            data={datos}
            width={windowWidth}
            height={250}
            chartConfig={chartConfig}
            verticalLabelRotation={15}
            bezier
            renderDotContent={({x, y, index, id, indexSet}) => (
              <View key={`${id}${index}${indexSet}`}>
                {datos.datasets[indexSet].id === id && (
                  <Text
                    key={datos.datasets[indexSet].id}
                    style={{position: 'absolute', top: y, left: x}}>
                    {datos.datasets[indexSet].data[index]}
                  </Text>
                )}
              </View>
            )}
          />
        </View>
      );
    } else if (prescripciones) {
      return <Notificaciones />;
    }
  };

  const Separator = () => <View style={styles.separator} />;

  const MapeoNotis = () => {
    return noti.datos.map((val, index) => {
      return (
        <View key={index}>
          <Button style={{nextFocusDown: true}}>
            <Text style={{fontSize: 20}}>
              {val.fecha} {val.mensaje}
            </Text>
          </Button>
        </View>
      );
    });
  };

  const Notificaciones = () => {
    return (
      <View style={{height: 280, width: windowWidth}}>
        <ScrollView>
          <List.Section
            style={{
              borderWidth: 0.5,
              backgroundColor: '#F1EFEF',
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
            }}>
            <List.Subheader style={{fontSize: 30}}>
              Notificaciones:
            </List.Subheader>
            <MapeoNotis />
          </List.Section>
        </ScrollView>
      </View>
    );
  };

  return cargando ? (
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
        backgroundColor: '#fff',
        justifyContent: 'center',
      }}>
      <Image
        style={{resizeMode: 'stretch', width: 1000, height: 120}}
        source={{
          uri: 'https://www.uta.edu.ec/v3.2/uta/images/header.png',
        }}
      />
      <Renderizado />
      <View
        style={{
          backgroundColor: '#fff',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{fontSize: 25}}>Desde: </Text>
        <Button
          color="#C1CBF4"
          compact={true}
          mode="contained"
          onPress={() => {
            if (moment(fechaFinal).isAfter(fechaInicio))
              setInicio(moment(fechaInicio).add(1, 'day').format('YYYY-MM-DD'));
          }}>
          +
        </Button>
        <Text style={{fontSize: 20}}>
          {moment(fechaInicio).format('DD-MM-YYYY')}
        </Text>
        <Button
          color="#C1CBF4"
          compact={true}
          mode="contained"
          onPress={() =>
            setInicio(
              moment(fechaInicio).subtract(1, 'day').format('YYYY-MM-DD'),
            )
          }>
          -
        </Button>
        <Text style={{fontSize: 25}}> Hasta: </Text>
        <Button
          color="#C1CBF4"
          compact={true}
          mode="contained"
          onPress={() =>
            setFinal(moment(fechaFinal).add(1, 'day').format('YYYY-MM-DD'))
          }>
          +
        </Button>
        <Text style={{fontSize: 20}}>
          {moment(new Date(fechaFinal), 'America/Guayaquil').format(
            'DD-MM-YYYY',
          )}
        </Text>
        <Button
          color="#C1CBF4"
          compact={true}
          mode="contained"
          onPress={() => {
            if (moment(fechaInicio).isBefore(fechaFinal))
              setFinal(
                moment(fechaFinal).subtract(1, 'day').format('YYYY-MM-DD'),
              );
          }}>
          -
        </Button>
      </View>
      <Separator />
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <Button
          style={{width: 150}}
          color="#C1CBF4"
          compact={true}
          mode="contained"
          onPress={getDatosGrafica}>
          Buscar
        </Button>
      </View>
      <Separator />
      <View style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
        <Button
          compact={true}
          color="#C1CBF4"
          mode="contained"
          onPress={() => {
            setGrafica(true);
            setPrescripciones(false);
          }}>
          Gráfico
        </Button>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Button
            compact={true}
            color="#C1CBF4"
            mode="contained"
            onPress={() => {
              setPrescripciones(true);
              setGrafica(false);
              notiLeido();
            }}>
            <Text>Notificaciones</Text>
          </Button>
          <Badge size={35}>{noti.contador}</Badge>
        </View>
      </View>
    </View>
  );
};

const chartConfig = {
  barPercentage: 1,
  backgroundColor: '#fff',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  useShadowColorFromDataset: false, // optional
};

const styles = StyleSheet.create({
  separator: {
    marginVertical: 5,
    marginHorizontal: 400,
    borderBottomColor: '#0C3ACA',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default Grafica;
