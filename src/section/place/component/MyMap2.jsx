import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { updatePlaces, getNearbyPlaces } from '../mapPlaceSlice';

// Custom hook to ensure Google Maps library is loaded
function useGoogleMapsLoader() {
  const [isLoaded, setIsLoaded] = useState(false);



  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDtOtDkj2UmvetGA13vyJJx91a_7O5awgg&libraries=places&callback=initMap`;
    script.async = true;


    window.initMap = () => setIsLoaded(true); // Callback function to set isLoaded to true
    document.head.appendChild(script);
    return () => {
      window.initMap = undefined;
      document.head.removeChild(script);
    };
  }, []);
  return isLoaded;
}

function MyMap2() {
  const Selector = useSelector((state) => state.placeStore);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [userLocation, setUserLocation] = useState(null)
  // let userLocation = { lat: 21.179586, lng: 72.810340 };


  const [infoWindow, setInfoWindow] = useState(null);
  const dispatch = useDispatch();

  const isGoogleMapsLoaded = useGoogleMapsLoader();


  function moveToNewPosition(newPosition) {
    const newCenter = new google.maps.LatLng(newPosition.lat, newPosition.lng);
    mapRef.current.panTo(newCenter);
  }


  const initMap = useCallback(() => {
    if (!isGoogleMapsLoaded) return;

    const pos = { lat: 21.179586, lng: 72.810340 };
    const map = new window.google.maps.Map(mapRef.current, {
      mapId: '9fcdcd6761d70af4',
      center: userLocation,
      zoom: 13,
    });
    mapRef.current = map;

    getUserCurrentLocation()
    setInfoWindow(new window.google.maps.InfoWindow());


  }, [isGoogleMapsLoaded]);


  const getUserCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };


          // setuserCurrentLoaction(userPos)

          mapRef.current.panTo(userPos)
          // userLocation = userPos
          setUserLocation(userPos)
          createCurrentUserMarker(userPos);
          // fetchNearbyHotels(userPos, Selector.category);
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  useEffect(() => {
    if (userLocation && Selector.category && isGoogleMapsLoaded) {
      fetchNearbyPlaces(userLocation, Selector.category);
    }
  }, [Selector.category, userLocation, isGoogleMapsLoaded]);


  // Function to fetch nearby places using Google Places API
  const fetchNearbyPlaces = (location, type) => {
    if (!mapRef.current) return; // Ensure mapRef.current is available

    const { lat, lng } = location;
    const service = new window.google.maps.places.PlacesService(mapRef.current);
    const request = {
      location: new window.google.maps.LatLng(lat, lng),
      radius: '3000',
      type: [type],
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const hotels = results.map(hotel => {
          let imageUrl = "";
          if (hotel.photos && hotel.photos.length > 0) {

            imageUrl = hotel.photos[0].getUrl({ maxWidth: 500 });
          }
          return {
            id: hotel.place_id,
            name: hotel.name,
            lat: hotel.geometry.location.lat(),
            lng: hotel.geometry.location.lng(),
            category: 'hotel', // Assuming you have a category field
            imageUrl: imageUrl, // Add image URL to the hotel information
          };
        });
        // Dispatch action to store hotels in Redux state
        dispatch(getNearbyPlaces(hotels));
      }
    });
  };


  useEffect(() => {
    initMap();
  }, [initMap]);

  useEffect(() => {
    if (isGoogleMapsLoaded) {
      console.log("marker created")
      createMarkers();
    }
    console.log("marker not created")

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [Selector, isGoogleMapsLoaded]);


  // Function to create markers for places
  async function createMarkers() {
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    Selector.places.forEach((p) => {

      const pinElement = Selector.hoverdPlaceID === p.id
        ? new PinElement({ scale: 1.2, background: "#ffffff" }).element
        : null;



      const marker = new AdvancedMarkerElement({
        position: { lat: p.lat, lng: p.lng },
        map: mapRef.current,
        content: pinElement,
        title: p.name,
        zIndex: Selector.hoverdPlaceID === p.id ? 2 : undefined,
      });




      Selector.hoverdPlaceID === p.id ? moveToNewPosition({ lat: p.lat, lng: p.lng }) : null
      markersRef.current.push(marker);



      marker.addListener('click', () => {
        if (infoWindow) {
          const infoWindowContent = createInfoWindowContent(p);
          infoWindow.setContent(infoWindowContent);
          infoWindow.open(mapRef.current, marker);
        }
      });
    });
  };

  // Function to create marker for user's current location
  const createCurrentUserMarker = async (userposition) => {
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    const pinScaled = new PinElement({
      glyphColor: "white",
      borderColor: "white",
      background: "#0000ff",
    });
    const marker = new AdvancedMarkerElement({
      position: userposition,
      map: mapRef.current,
      content: pinScaled.element,
      title: 'Your Location'
    });
  };

  function createInfoWindowContent(place) {
    const contentString = `
      <div class="info-content" style="padding: 7px; max-width: 200px;">
        <h1 style="font-size: 15px; margin: 0;">${place.name}</h1>
        <img src="${place.imageUrl}" class="w-full h-16 my-1 border p-0.5 border-black object-cover" alt="" />
        <p class="line-clamp-5 " style="font-size: 12px;">${place.description}</p>
      </div>
    `;

    return contentString;
  }

  return <div ref={mapRef} id="map" className="w-full h-full" />;
}

export default React.memo(MyMap2);