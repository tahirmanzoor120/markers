var map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.locationiq.com/v3/streets/vector.json?key=pk.0f147952a41c555a5b70614039fd148b', // stylesheet location
  center: [71.4728225594, 30.2259478878], // starting position [lng, lat]
  zoom: 10 // starting zoom
});

const geojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [71.46767271809128, 30.33031214415695]
      },
      properties: {
        address: 'Address of Point 1'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [71.7828430061773, 30.165710123851937]
      },
      properties: {
        address: 'Address of Point 2'
      }
    }
  ]
};

map.addControl(new maplibregl.NavigationControl());

const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    point: true,
    trash: true,
  }
});

map.addControl(draw, 'top-left');

const listener = async (event) => {
  let { features } = event;
  let firstFeature = features[0];
  if (firstFeature) {
    let { coordinates } = firstFeature.geometry;
    if (Array.isArray(coordinates[0][0])) {
      [coordinates] = coordinates;
    }
    console.log('Point: ' + coordinates[0] + " : " + coordinates[1])
    var el = document.createElement('div');
    el.innerHTML = 'Marker 1';
    const marker = new maplibregl.Marker({
      draggable: true
    })
      .setLngLat([coordinates[0], coordinates[1]])

      // .setPopup(new maplibregl.Popup().setHTML("<div><input name='poi-address' /><div><button>Save</button><button>Delete</button></div></div>"))
      .addTo(map);
    marker.on('drag', function () {
      console.log('Draging marker')
      // var lngLat = marker.getLngLat();
      // marker.setLngLat(lngLat);
    });

    markers.push(marker);
  }
  // const newItem = { name: '', area: geometryToArea(feature.geometry) };
  // draw.delete(feature.id);
  // try {
  //   const response = await fetch('/api/geofences', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(newItem),
  //   });
  //   if (response.ok) {
  //     const item = await response.json();
  //     navigate(`/settings/geofence/${item.id}`);
  //   } else {
  //     throw Error(await response.text());
  //   }
  // } catch (error) {
  //   dispatch(errorsActions.push(error.message));
  // }
};

map.on('draw.create', listener);

var bounds = map.getBounds();
console.log(bounds); // Outputs the LngLatBounds objects


// add markers to map
for (const feature of geojson.features) {
  // create a HTML element for each feature
  const el = document.createElement('i');
  el.className = 'icon-pin-alt marker';

  // make a marker for each feature and add to the map
  let marker = new maplibregl.Marker({
    element: el,
    draggable: true
  })

  marker.setLngLat(feature.geometry.coordinates)

  // Create a <button> element that will be used as the close button
  var button = document.createElement('button');
  button.innerHTML = '<i class="icon-cancel-circle2"></i>';
  button.className = 'close-button';

  marker.setPopup(new maplibregl.Popup({
    closeButton: false,
    closeOnClick: true
  }).setHTML(
    `<div class="modal-content">
      <div>
        <textarea
          class="form-control address"
          rows="5"
          cols="30"
        >${feature.properties.address}</textarea>
      </div>
      <div>
        <button class="btn btn-primary">Save</button>
        <button class="btn btn-danger">Delete</button>
      </div>
    </div>`
  ))
  marker.on('drag', function () {
    marker.getElement().className = 'icon-pin marker';

    // var lngLat = marker.getLngLat();
    // console.log(lngLat)
    // console.log(marker.getElement())
    // marker.setLngLat(lngLat);
  })

  marker.addTo(map);
}

