import { createSlice } from '@reduxjs/toolkit'

import places from "./data.json"


const initialState = {
    category: "lodging",
    places: [],
    hoverdPlaceID: "",

}

export const mapPlaceSlice = createSlice({
    name: 'place',
    initialState,
    reducers: {
        onCategoryChange: (state, action) => {



            state.category = action.payload


        },

        onPlaceHover: (state, action) => {
            state.hoverdPlaceID = action.payload
        }
        ,
        updatePlaces: (state, action) => {

            state.category = action.payload
        },

        getNearbyPlaces: (state, action) => {
            state.places = action.payload;



            console.log(action.payload)
            console.log(state.places)

        }

    },
})

export const { onCategoryChange, onPlaceHover, updatePlaces, getNearbyPlaces } = mapPlaceSlice.actions

export default mapPlaceSlice.reducer