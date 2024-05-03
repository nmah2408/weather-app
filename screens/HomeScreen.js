import { View, Image, Text, SafeAreaView, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { theme } from '../theme'
import {FontAwesome6} from '@expo/vector-icons'
import {debounce} from 'lodash'
import * as Progress from 'react-native-progress';
import { fetchLocations, fetchWeatherForecast } from '../services/apiServices'
import { convertConditionText, vietnameseDayNames, weatherImages } from '../constants'
import { getData, storeData } from '../utils/asyncStorage'

export default function HomeScreen() {
    const [locations, setLocation] = useState([])
    const [weather, setWeather] = useState({});
    const [loading, setLoading] = useState(true);

    const handleLocation = (location) => {
        setLocation([]);
        setLoading(true);
        fetchWeatherForecast({
            cityName: location.name,
            days: '7'
        }).then(data => {
            setWeather(data);
            setLoading(false);
            storeData('city', location.name);
        })
    }

    const handleSearch = value => {
        // fetch location
        if (value.length > 2) {
            fetchLocations({cityName: value}).then(data => {
                setLocation(data);
            })
        }
    }

    useEffect(() => {
        fetchMyWeatherData();
    }, [])

    const fetchMyWeatherData = async () => {
        let lastCity = await getData('city');
        let defaultCity = 'Hanoi';
        if (lastCity) defaultCity = lastCity;
        try {
          fetchWeatherForecast({
            cityName: defaultCity,
            days: '7'
            }).then(data => {
                setWeather(data);
                setLoading(false);
            });
        } catch (error) {
          console.error("Error requesting location permission:", error);
        }
    };

    const handleTextDebounce = useCallback(debounce(handleSearch, 0), []);
    const {current, location} = weather;

    return (
        <View className="flex-1 relative">
            <StatusBar style='dark'/>
            <Image source={require('../assets/images/background.jpg')}
                className="absolute h-full w-full"
            />
            {
                loading ? (
                    <View className="flex-1 flex-row justify-center items-center">
                        <Progress.CircleSnail thickness={2} size={50} color="#41B06E"/>
                    </View>
                ) : (
                    <SafeAreaView className="flex flex-1">
                        {/* search section */}
                        <View style={{height: '7%'}} className="mx-4 relative z-50">
                            <View 
                                className="flex-row justify-end items-center rounded-full"
                                style={{backgroundColor: theme.bgWhite(0.2)}}
                            >
                                <TextInput
                                onChangeText={handleTextDebounce}
                                    placeholder='Nhập tỉnh thành... VD: Saigon'
                                    placeholderTextColor={'lightgray'}
                                    selectionColor={'lightgray'}
                                    className="pl-6 h-12 text-base flex-1 text-white">
                                </TextInput>
                                <View
                                    style={{backgroundColor: theme.bgWhite(0.3)}}
                                    className="rounded-full p-3 m-1"
                                >
                                    <Text className="text-center text-white font-medium">English</Text>
                                </View>
                            </View>
                            {
                                locations.length > 0 ? (
                                    <View className="absolute w-full bg-gray-300 top-16 rounded-3xl">
                                        {
                                            locations.map((location, index) => {
                                                let showBorder = index + 1 != locations.length;
                                                let borderClass = showBorder ? 'border-b-2 border-b-gray-400' : '';
                                                return (
                                                    <TouchableOpacity
                                                        onPress={() => handleLocation(location)}
                                                        key={index}
                                                        className={"flex-row items-center border-0 p-3 px-4 mb-1" + borderClass}
                                                    >
                                                        <FontAwesome6 name="location-dot" size={24}/>
                                                        <Text className="text-base ml-2">{location?.name}, {location?.country}</Text>
                                                    </TouchableOpacity>
                                                )
                                            })
                                        }
                                    </View>
                                ) : null
                            }
                        </View>
                        {/* forecast section */}
                        <View className="mx-4 mb-2 flex flex-1 justify-around">
                            {/* location */}
                            <Text className="text-center text-white font-bold text-3xl">
                                {location?.name},
                                <Text className="text-xl font-semibold text-gray-300">
                                    {" " + location?.country}
                                </Text>
                            </Text>
                            {/* weather image */}
                            <View className="flex-row justify-center">
                                <Image
                                    source={weatherImages[current?.condition?.text]}
                                    className="h-52 w-52"
                                />
                            </View>
                            {/* degree celcius */}
                            <View className="space-y-2">
                                <Text className="font-bold text-white text-center text-6xl ml-5">
                                    {current?.temp_c}&#176;
                                </Text>
                                <Text className="text-white text-center text-xl tracking-widest">
                                    {convertConditionText[current?.condition.text]}
                                </Text>
                            </View>
                            {/* other stats */}
                            <View className="flex-row justify-between mx-4">
                                <View className="flex-row space-x-2 items-center">
                                    <FontAwesome6 name="wind" size={24} color='white' />
                                    <Text className="text-white font-semibold text-base">
                                        {current?.wind_kph}km
                                    </Text>
                                </View>
                                <View className="flex-row space-x-2 items-center">
                                    <FontAwesome6 name="temperature-three-quarters" size={24} color='white' />
                                    <Text className="text-white font-semibold text-base">
                                        {current?.humidity}%
                                    </Text>
                                </View>
                                <View className="flex-row space-x-2 items-center">
                                    <FontAwesome6 name="sun" size={24} color='white' />
                                    <Text className="text-white font-semibold text-base">
                                        {weather?.forecast?.forecastday[0]?.astro?.sunrise}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* forecast for the next day */}
                        <View className="mb-2 space-y-3">
                            <View className="flex-row items-center mx-5 space-x-2">
                                <FontAwesome6 name="calendar" size={24} color='white' />
                                <Text className="text-white text-base font-bold">Thời tiết 7 ngày tới</Text>
                            </View>
                            <ScrollView
                                horizontal
                                contentContainerStyle={{paddingHorizontal: 15}}
                                showsHorizontalScrollIndicator={false}
                            >
                                {
                                    weather?.forecast?.forecastday?.map((item, index) => {
                                        let date = new Date(item?.date);
                                        let options = {weekday: 'long'};
                                        let dayName = date.toLocaleDateString('en-US', options);
                                        dayName = dayName.split(',')[0];
                                        return (
                                            <View
                                                key={index}
                                                className="flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-4"
                                                style={{backgroundColor: theme.bgWhite(0.1)}}
                                            >
                                                <Image
                                                    source={weatherImages[item?.day?.condition?.text]}
                                                    className="h-12 w-12"
                                                />
                                                {
                                                    index == 0 ? (
                                                        <Text className="text-white text-sm font-bold">Ngày mai</Text>
                                                    ) : (
                                                        <Text className="text-white text-sm font-bold">{vietnameseDayNames[dayName]}</Text>
                                                    )
                                                }
                                                <Text className="text-white text-xl font-semibold">{item?.day?.avgtemp_c}&#176;</Text>
                                            </View>
                                        )
                                    })
                                }
                            </ScrollView>
                        </View>
                    </SafeAreaView>
                )
            }
        </View>
    )
}