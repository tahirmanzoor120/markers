// var api = "http://localhost:8082/api/poi"
var api = "http://46.101.184.82:8082/api/poi";
var username = 'admin'
var password = 'admin'

var minZoom = 14;

var points = [];

var drawControl = null;

var map = initMap();

map.on('load', () => {
    url = getUrlToFetchPoints();
    fetch(url, {
        headers: {
            Authorization: "Basic " + btoa(username + ":" + password),
        },
    })
        .then(response => response.json())
        .then(data => {
            setLoaderVisible(false);
            points = data;
            addMarkers(points);
        })
        .catch(error => {
            setLoaderVisible(false);
            alert(error)
        });
});

map.on('draw.create', async (event) => {
    drawControl.trash()
    const coordinates = event.features[0].geometry.coordinates;
    const point = {
        id: 0,
        lon: coordinates[0],
        lat: coordinates[1],
        address: ''
    }
    const isSaved = false;
    createMarker(point, isSaved);
});

map.on("dragend", () => {
    const currentZoom = map.getZoom();
    if (currentZoom >= minZoom) {
        setLoaderVisible(true);

        url = getUrlToFetchPoints();
        fetch(url, {
            headers: {
                Authorization: "Basic " + btoa(username + ":" + password),
            },
        })
            .then(response => response.json())
            .then(data => {
                setLoaderVisible(false);
                removeMarkers(points);
                const fetchedPoints = data;
                addMarkers(fetchedPoints);
                points.push(...fetchedPoints);
            })
            .catch(error => {
                setLoaderVisible(false);
                alert(error)
            });
    }
});

map.on("zoomend", () => {
    const currentZoom = map.getZoom();
    if (currentZoom <= minZoom && points.length > 0) {
        removeMarkers(points);
        setInstructionsVisible(true);
    }
    else if (currentZoom > minZoom && points.length == 0) {
        setInstructionsVisible(false);
        setLoaderVisible(true);
        url = getUrlToFetchPoints();
        fetch(url, {
            headers: {
                Authorization: "Basic " + btoa(username + ":" + password),
            },
        })
            .then(response => response.json())
            .then(data => {
                setLoaderVisible(false);
                points = data;
                addMarkers(points);
            })
            .catch(error => {
                setLoaderVisible(false);
                alert(error)
            });
    }
});

function initMap() {
    const mapStyle = 'https://tiles.locationiq.com/v3/streets/vector.json?key=pk.0f147952a41c555a5b70614039fd148b'
    const startingPosition = [71.4728225594, 30.2259478878];
    const startingZoom = 14;

    const map = new maplibregl.Map({
        container: 'map',
        style: mapStyle,
        center: startingPosition,
        zoom: startingZoom,
    });

    map.addControl(new maplibregl.NavigationControl());

    // Add Draw Controls
    drawControl = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            point: true,
            trash: true,
        }
    });

    map.addControl(drawControl, 'top-left');
    return map;
}

function getUrlToFetchPoints() {
    const bounds = map.getBounds();

    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();

    return api + "?" + "south=" + south + "&north=" + north + "&west=" + west + "&east=" + east;
}

function addMarkers(pointsList) {
    pointsList.forEach((point) => {
        const marker = createMarker(point);
        point.marker = marker;
    });
}

function removeMarkers(pointsList) {
    pointsList.forEach(p => p.marker.remove());
    pointsList.splice(0, pointsList.length);
}

function createMarker(point, isSaved = true) {

    let { id, address, lon, lat } = point;

    // Textarea for Address
    const textArea = document.createElement('textarea');
    textArea.className = "form-control address"
    textArea.rows = 5;
    textArea.cols = 30;

    if (isSaved) {
        textArea.disabled = true;
        textArea.value = address;
    }
    else {
        textArea.placeholder = "Please enter address of this place here.";
    }

    const textAreaContainer = document.createElement('div');
    textAreaContainer.appendChild(textArea);

    // Edit Button
    const editSaveButton = document.createElement('button');
    editSaveButton.className = "btn btn-primary button";
    editSaveButton.innerText = (isSaved ? 'Edit' : 'Save');

    // Delete Button
    const deleteButton = document.createElement('button');
    deleteButton.className = "btn btn-danger button";
    deleteButton.innerText = 'Delete'

    // Button Container
    const btnContainer = document.createElement('div');
    btnContainer.className = "btn-container"
    btnContainer.appendChild(editSaveButton);
    btnContainer.appendChild(deleteButton);



    // Popup Container
    const popupContainer = document.createElement('div');
    popupContainer.className = "modal-content";

    if (isSaved) {
        // ID
        const span = document.createElement('span');
        span.className = "badge badge-light";
        span.innerHTML = id;
        // ID Container
        const idContainer = document.createElement('div');
        idContainer.className = 'id';
        idContainer.appendChild(span);
        popupContainer.appendChild(idContainer);
    }

    popupContainer.appendChild(textAreaContainer);
    popupContainer.appendChild(btnContainer);

    // Popup
    const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: true
    }).setDOMContent(popupContainer)

    // Marker
    const marker = new maplibregl.Marker()
    marker.setLngLat([lon, lat]).setPopup(popup);

    if (!isSaved) {
        marker.setDraggable(true);
        editSaveButton.disabled = true;
    }

    // Event Listeners

    // Marker Dragged
    marker.on('dragend', function () {
        if(textArea.value.length == 0) return;

        var lngLat = marker.getLngLat();
        lon = lngLat.lng;
        lat = lngLat.lat;
        editSaveButton.className = "btn btn-info button"
        editSaveButton.innerText = (isSaved ? 'Update' : 'Save');
        editSaveButton.disabled = false;
    });

    textArea.addEventListener('input', (e) => {
        if(textArea.value.length == 0) {
            editSaveButton.disabled = true;
            return;
        }

        if (!isSaved || textArea.value != address) {
            editSaveButton.className = "btn btn-info button"
            editSaveButton.innerText = (isSaved ? 'Update' : 'Save');
            editSaveButton.disabled = false;
        }
        else {
            editSaveButton.className = "btn btn-primary button";
            editSaveButton.innerText = 'Edit';
            editSaveButton.disabled = true;
        }
    })

    // Edit/Save
    editSaveButton.addEventListener('click', (e) => {
        // Make Pin Editable
        if (editSaveButton.innerText == 'Edit') {
            editSaveButton.disabled = true;
            textArea.disabled = false;
            marker.setDraggable(true);
            return;
        }

        // Save new Pin on Server
        if (!isSaved) {
            setLoaderVisible(true);
            fetch(api, {
                method: 'POST',
                body: JSON.stringify({
                    id: 0,
                    address: textArea.value,
                    lon,
                    lat,
                }),
                headers: {
                    Authorization: "Basic " + btoa(username + ":" + password),
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    setLoaderVisible(false);
                    editSaveButton.innerText = 'Saved';
                    editSaveButton.disabled = true;
                    setTimeout(() => {
                        editSaveButton.className = "btn btn-primary button";
                        editSaveButton.innerText = 'Edit';
                        editSaveButton.disabled = false;
                        isSaved = true;
                    }, 3000);
                })
                .catch(error => {
                    setLoaderVisible(false);
                    console.error(error);
                });

            return;
        }

        // Update Pin on Server
        setLoaderVisible(true);

        fetch(api + "/" + id, {
            method: 'PUT',
            body: JSON.stringify({
                id,
                address: textArea.value,
                lon,
                lat,
            }),
            headers: {
                Authorization: "Basic " + btoa(username + ":" + password),
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json()).then(data => {
                setLoaderVisible(false);
                editSaveButton.innerText = 'Updated';
                editSaveButton.disabled = true;
                setTimeout(() => {
                    editSaveButton.className = "btn btn-primary button";
                    editSaveButton.innerText = 'Edit';
                    editSaveButton.disabled = false;
                }, 3000);
            })
            .catch(error => {
                setLoaderVisible(false);
                alert(error);
                console.error(error);
            });
    });

    // Delete
    deleteButton.addEventListener('click', (e) => {
        if (isSaved) {
            const text = "Do you realy want to delete this pin?";
            if (confirm(text) == true) {
                setLoaderVisible(true);
                // Delete pin from server
                fetch(api + "/" + id, {
                    method: 'DELETE',
                    headers: {
                        Authorization: "Basic " + btoa(username + ":" + password),
                    },
                })
                    .then(response => {
                        if (response.ok) {
                            setLoaderVisible(false);
                            marker.remove()
                        } else {
                            alert('Server delete operation failed.')
                        }
                    })
                    .catch(error => {
                        alert(error)
                    });
            }
        }
        else {
            marker.remove()
        }
    });

    marker.addTo(map);
    return marker;
}

function setLoaderVisible(isBusy) {
    document.getElementById('loader').style.display = (isBusy ? 'block' : 'none');
}

function setInstructionsVisible(isVisible) {
    document.getElementById('instructions').style.display = (isVisible ? 'block' : 'none');
}
