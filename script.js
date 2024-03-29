let isMobile;
const defaultCellSize = 130;
const screenWidth = window.screen.width;
const screenHeight = window.screen.height;
const innerWidth = window.innerWidth;
const innerHeight = window.innerHeight;

function initializePage() {
    const consoleWrapper = document.querySelector('.consoleWrapper');
    const consoleScale = Math.min(screenWidth / 700, 1);
    consoleWrapper.style.transform = `scale(${consoleScale})`;

    const roundButton = document.querySelector('.roundButtonContainer');
    roundButton.style.top = `${consoleScale * 470 - 10}px`;

    isMobile = Math.min(screenWidth, screenHeight) < 770;

    if (isMobile) {
        consoleWrapper.style.top = `-100px`;
        document.querySelector('.scanlines').classList.add('mobile');
        roundButton.style.transform = `scale(.75)`;
        roundButton.style.top = `${(screenWidth / 700) * 470 - 40}px`;
        
        const mobileInput = document.createElement('input');
        mobileInput.classList.add('mobileInput', 'blurOut');
        document.querySelector('.consolePanel').appendChild(mobileInput);
        weatherConsole.consoleInput = mobileInput;

        pillarArray.initializeArray(70);
        weatherConsole.initializeInput();
        rayController.initializeSun();
        return;
    }

    const standardInput = document.createElement('div');
    standardInput.classList.add('consoleInput', 'blurOut');
    document.querySelector('.consolePanel').appendChild(standardInput);
    weatherConsole.consoleInput = standardInput;

    pillarArray.initializeArray();
    weatherConsole.initializeInput();
    rayController.initializeSun();
}

// Object that controls central display element and fetches weather data
const weatherConsole = {
    activeScreen: document.querySelector('.contentOne'),
    inactiveScreen: document.querySelector('.contentTwo'),
    cloudLayer: document.querySelector('#cloudLayer'),
    inputEnabled: false,
    weatherData: {},
    
    // Called on page load, adds event listener for key inputs
    initializeInput() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && this.consoleInput.textContent.length > 0 && this.inputEnabled && !isMobile) {
                this.consoleInput.textContent = this.consoleInput.textContent.substring(0, this.consoleInput.textContent.length - 1);
            } else if (/[A-Za-z0-9\s,]+/.test(e.key) && e.key.length === 1 && this.inputEnabled && !isMobile) {
                this.consoleInput.textContent += e.key;
            } else if (e.key === 'Enter') {
                pillarArray.click();
            }
        });
    },

    // Fetches weather data for given location, then calls methods to display the returned data
    fetchWeather() {
        this.inputEnabled = false;
        this.displayText('Searching', 'searching');
        // this.changeCircuitState('glowing');
        const location = isMobile ? this.consoleInput.value : this.consoleInput.textContent;

        //For testing purposes, allow forced weather effect with associated with code
        if (typeof (location - 0) === 'number' && !isNaN(location - 0)) {
            this.weatherData = {
                condition: 'testCondtion',
                icon: '',
                code: location - 0,
                temp: 'testTemp',
                windSpeed: '10',
                windDirection: 'N',
                windDegree: 70,
                location: 'Test Location',
                region: 'Testria',
                country: 'Testria',
                isDay: true
            }
            console.log(this.weatherData)

            this.setWeatherEffects(this.weatherData.code);
            return;
        }

        const url = `https://api.weatherapi.com/v1/current.json?key=68c11438bfb24241860201215232610&q=${location}`;
        const weatherPromise = fetch(url, {mode: 'cors'});
        weatherPromise.then(async (response) => {
            await new Promise(res => setTimeout(res, 1500));
            if (!response.ok) {
                throw new Error(response.status);
            }

            return response.json();
        })
        .then((fetchedData) => {
            this.weatherData = {
                condition: fetchedData.current.condition.text,
                icon: fetchedData.current.condition.icon,
                code: fetchedData.current.condition.code,
                temp: fetchedData.current.temp_f,
                windSpeed: fetchedData.current.wind_mph,
                windDirection: fetchedData.current.wind_dir,
                windDegree: fetchedData.current.wind_degree,
                location: fetchedData.location.name,
                region: fetchedData.location.region,
                country: fetchedData.location.country,
                isDay: fetchedData.current.is_day
            }

            this.setWeatherEffects(this.weatherData.code);
        })
        .catch((error) => {
            console.log(error.message);
            switch (error.message) {
                case '400':
                    this.displayText('ERROR \n \n Location not found', 'errorDisplay');
                    pillarArray.enableRefresh();
                    break;
                default:
                    this.displayText('ERROR \n \n Invalid API Key', 'errorDisplay');
                    pillarArray.enableRefresh();
                    break;
            }
        });
    },

    displayFilter: document.querySelector('#displayFilter'),
    changeDisplayFilter(setting) {
        if (setting != 'hidden') {
            this.displayFilter.classList.remove('night', 'sunShine', 'overcast', 'fog', 'cloudy');
            this.displayFilter.classList.add(setting);
            this.displayFilter.classList.remove('hidden');
        } else {
            this.displayFilter.classList.add('hidden');
        }
    },

    setWeatherEffects(code) {
        if ([1030, 1114, 1117, 1135, 1147, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) {
            this.changeDisplayFilter('haze');
        } else if (!this.weatherData.isDay) {
            this.changeDisplayFilter('night');
        } else if ([1006, 1009, 1030, 1135, 1147, 1186, 1189, 1192, 1195, 1201, 1207, 1243, 1246, 1252, 1276, 1282].includes(code)) {
            this.changeDisplayFilter('overcast');
        } else {
            this.changeDisplayFilter('sunShine');
        }

        if ([1063, 1069, 1072, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1204, 1207, 1240, 1243, 1246, 1249, 1252, 1273, 1276].includes(code)) {
            this.makeRainSnow('rain');
        } else if ([1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1279, 1282].includes(code)) {
            this.makeRainSnow('snow');
        } else if (this.weatherData.windSpeed > 10 && !isMobile) {
            windController.toggleActiveWind();
            windController.createWindgroup(this.weatherData.windDegree);
        } else if ((code === 1000 || code === 1003) && this.weatherData.isDay) {
            rayController.rayStart(400);
        } else if (code === 1006) {
            this.cloudLayer.classList.remove('hidden');
        }
        
        if ([1087, 1273, 1276, 1279, 1282].includes(code)) {
            this.setFlashState(true);
        }

        this.swapScreen('weatherDisplay');
        pillarArray.changePillarGlyphs(this.weatherData.icon);
        pillarArray.wobbling = true;
        pillarArray.wobble(300);
        pillarArray.enableRefresh();
    },

    disableWeatherEffects() {
        pillarArray.refreshEnabled = false;
        pillarArray.wobbling = false;
        this.activeParticles = false;
        this.setFlashState(false);
        windController.toggleActiveWind(false);
        this.cloudLayer.classList.add('hidden');
        rayController.rayEnd();
        this.changeDisplayFilter('hidden');
    },

    circuitMutable: true,
    circuitState: 'unset',
    async changeCircuitState(state) {
        if (isMobile) {
            return;
        }

        const circuits = document.querySelectorAll('.circuit');
        
        if (state === 'pulsing' || (state === 'autoPulse' && this.circuitState === 'pulsing')) {
            this.circuitState = 'pulsing';
            for (let circuit of circuits) {
                circuit.classList.add('glowing');
            }

            await new Promise(res => setTimeout(res, 1200));
            if (this.circuitState === 'pulsing') {
                for (let circuit of circuits) {
                    circuit.classList.remove('glowing');
                }
            } else {
                return;
            }

            await new Promise(res => setTimeout(res, 5000));
            this.changeCircuitState('autoPulse');
        } else if (state === 'glowing') {
            this.circuitState = 'glowing';
            for (let circuit of circuits) {
                circuit.classList.add('glowing');
            }
        }
    },

    // Change display to given message / screen class
    displayText(text, screenClass = null) {
        this.inactiveScreen.textContent = text;
        this.swapScreen(screenClass);
    },

    // The display uses two screens with only one being shown at a time.
    // New content is added to the inactive screen and then transitioned to
    async swapScreen(screenClass) {
        this.consoleInput.classList.add('blurOut');

        // removes old classes from inactive screen before adding new content
        for (let screenClass of this.inactiveScreen.classList) {
            if (screenClass != 'consoleContent'
                && screenClass != 'contentOne'
                && screenClass != 'contentTwo'
                && screenClass != 'blurOut') {
                    this.inactiveScreen.classList.remove(screenClass);
                }
        }

        if (screenClass) {
            // new class is added if provided
            this.inactiveScreen.classList.add(`${screenClass}`);
            // if weather data is being displayed then additional styling is necessary
            if (screenClass === 'weatherDisplay') {
                this.inactiveScreen.textContent = '';

                const location = document.createElement('div');
                location.classList.add('locationHeader');
                if (this.weatherData.country === "United States of America" 
                    || this.weatherData.country === "USA United States of America") {
                    location.textContent = `${this.weatherData.location}, ${this.weatherData.region}`;
                } else {
                    location.textContent = `${this.weatherData.location}, ${this.weatherData.country}`;
                }
                this.inactiveScreen.appendChild(location);

                const condition = document.createElement('div');
                condition.classList.add('weatherDetail');
                condition.textContent = `${this.weatherData.condition}`;
                this.inactiveScreen.appendChild(condition);

                const temp = document.createElement('div');
                temp.classList.add('weatherDetail');
                temp.textContent = `${this.weatherData.temp} °F`;
                this.inactiveScreen.appendChild(temp);

                const windSpeed = document.createElement('div');
                windSpeed.classList.add('weatherDetail');
                windSpeed.textContent = `Wind Speed \n ${this.weatherData.windSpeed} mph`;
                this.inactiveScreen.appendChild(windSpeed);

                const windDirection = document.createElement('div');
                windDirection.classList.add('windDetail');
                const compass = document.createElement('div');
                compass.classList.add('compass');
                windDirection.appendChild(compass);
                const northDirection = document.createElement('div');
                northDirection.classList.add('northDirection');
                northDirection.textContent = 'N';
                compass.appendChild(northDirection);
                const southDirection = document.createElement('div');
                southDirection.classList.add('southDirection');
                southDirection.textContent = 'S';
                compass.appendChild(southDirection);
                const westDirection = document.createElement('div');
                westDirection.classList.add('westDirection');
                westDirection.textContent = 'W';
                compass.appendChild(westDirection);
                const eastDirection = document.createElement('div');
                eastDirection.classList.add('eastDirection');
                eastDirection.textContent = 'E';
                compass.appendChild(eastDirection);
                const windArrow = document.createElement('div');
                windArrow.classList.add('windArrow');
                windArrow.style.transform = `rotate(${this.weatherData.windDegree}deg)`;
                compass.appendChild(windArrow);
                this.inactiveScreen.appendChild(windDirection);
            }
        }
        this.activeScreen.classList.add('blurOut');
        this.inactiveScreen.classList.remove('blurOut');

        const temp = this.activeScreen;
        this.activeScreen = this.inactiveScreen;
        this.inactiveScreen = temp;
    },

    // Raises console element from initial state, then displays opening message
    async raiseConsole() {
        const consoleElement = document.querySelector('.consoleWrapper');

        if (!isMobile) {
            await new Promise(res => setTimeout(res, 500));
            this.changeCircuitState('pulsing');

            await new Promise(res => setTimeout(res, 2500));
            consoleElement.classList.add('raised');
        } else {
            await new Promise(res => setTimeout(res, 600));
            consoleElement.classList.add('raised');
        }

        await new Promise(res => setTimeout(res, 300));
        consoleElement.classList.remove('collapsed');
        consoleElement.classList.add('poweredOn');

        await new Promise(res => setTimeout(res, 500));
        this.swapScreen('sunrise');

        await new Promise(res => setTimeout(res, 1500));
        this.displayText('Where would you like to look? \n \n');

        await new Promise(res => setTimeout(res, 500));
        this.enableInput();
    },

    async enableInput() {
        this.consoleInput.textContent = '';
        this.consoleInput.classList.remove('blurOut');
        this.inputEnabled = true;

        await new Promise(res => setTimeout(res, 1000));
        pillarArray.raiseButton('searchGlyph');
    },

    activeParticles: false,
    dropFrequency: (1920 / innerWidth) * 20,
    snowFrequency: (1920 / innerWidth) * 200,
    dropSpeed: (innerHeight / 1080) * .7,
    snowSpeed: (innerHeight / 1080) * 8,
    async makeRainSnow(particleType) {
        this.activeParticles = true;
        const body = document.querySelector('body');
        const particleFrequency = particleType === 'rain' ? this.dropFrequency : this.snowFrequency;
        const particleSpeed = particleType === 'rain' ? this.dropSpeed : this.snowSpeed;
        
        while (this.activeParticles) {
            const particle = document.createElement('div');
            particle.classList.add(particleType);
            particle.style.left = `${getRandomInt(0, innerWidth)}px`;
            const fallDistance = particleType === 'rain' ? getRandomInt(20, 100) : getRandomInt(60, 110);
            particle.style.animationDuration = `${fallDistance / 100 * particleSpeed}s`;
            particle.style.top = `${fallDistance}%`;
            body.appendChild(particle);

            particle.addEventListener('animationend', () => {
                particle.remove();
            });

            await new Promise(res => setTimeout(res, particleFrequency));
        }
    },

    flashing: false,
    setFlashState(state) {
        if (state) {
            this.flashing = true;
            setTimeout(() => {
                this.lightningFlash();
            }, 3000);
        } else {
            this.flashing = false;
        }
    },

    lightningFlash() {
        if (!this.flashing) {
            return;
        }

        this.displayFilter.classList.add('lightningFlash');
        this.displayFilter.addEventListener('animationend', () => {
            this.displayFilter.classList.remove('lightningFlash');
        });

        setTimeout(() => {
            this.lightningFlash();
        }, getRandomInt(4000, 8000));
    },
}

const rayController = {
    sun: document.querySelector('#sun'),
    rays: [],
    diagonal: Math.sqrt(Math.pow((innerHeight * 3), 2) + Math.pow((innerWidth * .5), 2)),
    initializeSun() {
        const angle = ((Math.atan((innerWidth * .5) / (innerHeight * 2)) * 180) / Math.PI);
        
        // let maxAngle = ((Math.atan((innerWidth * 2) / innerHeight) * 180) / Math.PI);
        // const minAngle = ((Math.atan((innerWidth) / (innerHeight * 2)) * 180) / Math.PI) - 10;
        let currentAngle = angle * -1;

        const rayCount = isMobile ? 15 : 20;
        for (let i = 0; i < rayCount; i++) {
            const rayElement = document.createElement('div');
            rayElement.classList.add('ray');
            this.rays.push(rayElement);
            this.sun.appendChild(rayElement);
        }

        for (let ray of this.rays) {
            const rayWidth = isMobile ? 15 : 50;
            ray.style.width = `${rayWidth * (getRandomInt(5, 10) * .1)}px`;
            ray.style.transform = `rotate(${currentAngle}deg)`;

            currentAngle += (angle * 2) / this.rays.length;
        }

        this.alternateRayArray = [...this.rays];
        this.minRayCount = isMobile ? this.rays.length / 4 : this.rays.length / 2;
    },

    shining: false,
    rayStart(delay) {
        this.shining = true;
        this.sun.classList.add('rotateReset');

        for (let ray of this.rays) {
            const rayChance = isMobile ? getRandomInt(-1, 1) : getRandomInt(0, 1);
            if (rayChance > 0) {
                this.randomizeRay(ray);
                this.activeRayCount++;
            }
        }

        setTimeout(() => {
            this.alternateRays(delay);
        }, delay);
    },

    rayEnd() {
        if (!this.shining) {
            return;
        }

        this.shining = false;
        setTimeout(() => {
            if (!this.shining) {
                this.sun.classList.remove('rotateReset');
            }
        }, 3000);

        for (let ray of this.rays) {
            ray.style.opacity = 0;
        }
    },

    alternateRayArray: [],
    activeRayCount: 0,
    minRayCount: 0,
    alternateRays(delay) {
        if (!this.shining) {
            return;
        }

        if (this.alternateRayArray.length > 0) {
            const chosenRay = this.alternateRayArray.splice(getRandomInt(0, this.alternateRayArray.length - 1), 1);
            if (chosenRay[0].style.opacity != 0 && this.activeRayCount > this.minRayCount) {
                chosenRay[0].style.opacity = 0;
                this.activeRayCount--;
            } else if (chosenRay[0].style.opacity == 0) {
                this.randomizeRay(chosenRay[0]);
                this.activeRayCount++;
            }

            setTimeout(() => {
                this.alternateRayArray.push(chosenRay[0]);
                if (!this.shining) {
                    chosenRay[0].style.opacity = 0;
                }
            }, 4000);
        }

        setTimeout(() => {
            this.alternateRays(delay);
        }, delay);
    },

    randomizeRay(ray) {
        // adjust these values tomorrow
        const heightModifier = isMobile ? getRandomInt(100, 115) * .01 : getRandomInt(85, 115) * .01;
        ray.style.height = `${this.diagonal * heightModifier}px`;
        ray.style.opacity = `${getRandomInt(5, 8) * .1}`;
    }
}

const windController = {
    activeWind: false,
    toggleActiveWind(value = null) {
        if (value === false || value === true) {
            this.activeWind = value;
            return;
        }
        this.activeWind = this.activeWind ? false : true;
    },

    // Creates a random group of wind lines moving in the given direction
    pastCoordinates: [],
    createWindgroup(windAngle, delay = 6000) {
        if (!this.activeWind) {
            return;
        }
        
        const windStyle = {};

        windStyle.windAngle = windAngle;
        windStyle.lineVariant = getRandomInt(1, 3);
        const windGroupSize = getRandomInt(3, 6);
        windStyle.duration = ((Math.sqrt(Math.pow(screenWidth, 2) + Math.pow(screenHeight, 2)) + 400) / 4000) * 15000;

        if (windAngle === 0 || windAngle === 360) {
            windStyle.left = getRandomInt(-100, innerWidth);
            windStyle.leftAfter = 0;
            windStyle.bottom = -200;
            windStyle.bottomAfter = 3800;
            windStyle.swapSides = true;
        } else if (windAngle === 90) {
            windStyle.bottom = getRandomInt(-100, innerHeight);
            windStyle.bottomAfter = 0;
            windStyle.left = -200;
            windStyle.leftAfter = 3800;
        } else if (windAngle === 180) {
            windStyle.left = getRandomInt(-100, innerWidth);
            windStyle.leftAfter = 0;
            windStyle.top = -200;
            windStyle.topAfter = 3800;
        } else if (windAngle === 270) {
            windStyle.bottom = getRandomInt(-100, innerHeight);
            windStyle.bottomAfter = 0;
            windStyle.right = -200;
            windStyle.rightAfter = 3800;
        } else {
            const sideOne = Math.round(Math.sin((windAngle % 90) * (Math.PI / 180)) * 3800);
            const sideTwo = Math.round(Math.cos((windAngle % 90) * (Math.PI / 180)) * 3800);
            let directionOne;
            let directionTwo;
            let subsectionAngle;

            if (windAngle < 90) {
                directionOne = 'bottom';
                directionTwo = 'left';
                windStyle.swapSides = true;
                subsectionAngle = windAngle;
            } else if (windAngle < 180) {
                directionOne = 'top';
                directionTwo = 'left';
                windStyle.swapSides = false;
                subsectionAngle = 90 - (windAngle % 90);
            } else if (windAngle < 270) {
                directionOne = 'top';
                directionTwo = 'right';
                windStyle.swapSides = true;
                subsectionAngle = windAngle % 90;
            } else {
                directionOne = 'bottom';
                directionTwo = 'right';
                windStyle.swapSides = false;
                subsectionAngle = 90 - (windAngle % 90);
            }

            let subsection = (((Math.tan(subsectionAngle * (Math.PI / 180))) * innerHeight) * innerHeight) / 2;
            let ratio = subsection / (innerHeight * innerWidth);
            if (ratio > .5) {
                subsection = (((Math.tan((90 - subsectionAngle) * (Math.PI / 180))) * innerWidth) * innerWidth) / 2;
                ratio = 1 - (subsection / (innerHeight * innerWidth));
            }

            if (getRandomInt(1, 1000) < ratio * 1000) {
                let yPosition = getRandomInt(-200, innerHeight - 200);
                let validity = false;
                if (this.pastCoordinates.length > 0 && !isMobile) {
                    while (!validity) {
                        validity = true;
                        for (let coordinate of this.pastCoordinates) {
                            if (Math.abs(yPosition - coordinate[0]) < 200) {
                                validity = false;
                            }
                        }

                        if (!validity) {
                            yPosition = getRandomInt(-200, innerHeight - 200);
                        }
                    }
                }
                this.pastCoordinates.push([yPosition, -200]);
                if (this.pastCoordinates.length > 3) {
                    this.pastCoordinates.shift();
                }

                windStyle[directionOne] = yPosition;
                windStyle[directionTwo] = -200;
                windStyle[`${directionOne}After`] = windStyle.swapSides ? sideTwo  : sideOne;
                windStyle[`${directionTwo}After`] = windStyle.swapSides ? sideOne  : sideTwo;
            } else {
                let xPosition = getRandomInt(-200, innerWidth);
                let validity = false;
                if (this.pastCoordinates.length > 0 && !isMobile) {
                    while (!validity) {
                        validity = true;
                        for (let coordinate of this.pastCoordinates) {
                            if (Math.abs(xPosition - coordinate[1]) < 200) {
                                validity = false;
                            }
                        }

                        if (!validity) {
                            xPosition = getRandomInt(-200, innerHeight);
                        }
                    }
                }
                this.pastCoordinates.push([-200, xPosition]);
                if (this.pastCoordinates.length > 3) {
                    this.pastCoordinates.shift();
                }

                windStyle[directionOne] = -200;
                windStyle[directionTwo] = xPosition;
                windStyle[`${directionOne}After`] =  windStyle.swapSides ? sideTwo : sideOne;
                windStyle[`${directionTwo}After`] = windStyle.swapSides ? sideOne : sideTwo;
            }
        }

        let offset = 0;
        
        for (let i = 0; i < windGroupSize; i++) {
            offset += getRandomInt(10, 30);

            let yOffset = offset;
            let xOffset = offset;

            if (windAngle % 90 != 0) {
                if (windStyle.swapSides) {
                    yOffset = offset / Math.sin((windAngle % 90) * (Math.PI / 180));
                    xOffset = Math.tan((windAngle % 90) * (Math.PI / 180)) * yOffset;
                } else {
                    xOffset = offset / Math.sin((windAngle % 90) * (Math.PI / 180));
                    yOffset = Math.tan((windAngle % 90) * (Math.PI / 180)) * xOffset;
                }
    
                if (yOffset > xOffset) {
                    yOffset = 0;
                } else {
                    xOffset = 0;
                }
            }
            

            this.createWindLine(windStyle, yOffset, xOffset);
        }

        setTimeout(() => {
            this.createWindgroup(windAngle);
        }, delay);
    },

    // Creates individual windlines with the passed styling and position
    async createWindLine(windStyle, yOffset, xOffset) {
        await new Promise(res => setTimeout(res, getRandomInt(0, 1000)));
        
        const windLine = document.createElement('div');
        windLine.classList.add('windLine', `line${windStyle.lineVariant}`);
        windLine.style.transform = `rotateZ(${windStyle.windAngle - 90}deg)`;
        document.querySelector('body').appendChild(windLine);
        setTimeout(() => {
            windLine.remove();
        }, windStyle.duration);

        let xDirection;

        if (windStyle.left) {
            windLine.style.left = `${windStyle.left - xOffset}px`;
            xDirection = 'left';
        } else {
            windLine.style.right = `${windStyle.right - xOffset}px`;
            xDirection = 'right';
        }

        if (windStyle.top) {
            windLine.style.top = `${windStyle.top - yOffset}px`;
            setTimeout(() => {
                windLine.style.transform = xDirection === 'left' ? `translate(${windStyle.leftAfter}px, ${windStyle.topAfter}px) rotateZ(${windStyle.windAngle - 90}deg)` 
                    : `translate(-${windStyle.rightAfter}px, ${windStyle.topAfter}px) rotateZ(${windStyle.windAngle - 90}deg)`;
            }, 10);
        } else {
            windLine.style.bottom = `${windStyle.bottom - yOffset}px`;
            setTimeout(() => {
                windLine.style.transform = xDirection === 'left' ? `translate(${windStyle.leftAfter}px, -${windStyle.bottomAfter}px) rotateZ(${windStyle.windAngle - 90}deg)` 
                    : `translate(-${windStyle.rightAfter}px, -${windStyle.bottomAfter}px) rotateZ(${windStyle.windAngle - 90}deg)`;
            }, 10);
        }

        setTimeout(() => {
            windLine.style.backgroundPosition = 'right';
        }, 10);
    }
}

const pillarArray = {
    roundButton: document.querySelector('.roundButtonContainer'),
    roundFace: document.querySelector('.roundFace'),
    buttonLockout: false,

    // Initializes pillars and central button
    initializeArray(cellSize = defaultCellSize) {
        this.roundButton.classList.add('powerGlyph');
        this.roundButton.style.transform = `scale(${cellSize / defaultCellSize})`;
        this.roundFace.addEventListener('click', () => {
            this.click();
        });

        const backgroundLayer = document.querySelector('.backgroundLayer');
        backgroundLayer.style['margin-top'] = `${60 * (cellSize / defaultCellSize)}px`;
        this.columns = Math.floor((innerWidth) / cellSize);
        this.columns = this.columns % 2 == 0 ? this.columns : this.columns + 1;
        backgroundLayer.style['gridTemplateColumns'] = `repeat(${this.columns}, ${cellSize}px)`;
        this.rows = Math.floor((innerHeight) / cellSize);
        backgroundLayer.style['gridTemplateRows'] = `repeat(${this.rows}, ${cellSize}px)`;
        let pillarNum = this.columns * this.rows;
        let rowIndex = 0;
        let columnIndex = 0;
        this.sideWidth = (this.columns - 6) / 2;
        let screenEndIndex = cellSize < defaultCellSize ? 400 / cellSize : 6;

        for (let i = 0; i < pillarNum; i++) {
            if (rowIndex > -1 && rowIndex < screenEndIndex
                && (columnIndex >= this.sideWidth)
                && columnIndex < this.sideWidth + 6) {
                    if (rowIndex >= 5 && (columnIndex === this.sideWidth || columnIndex === this.sideWidth + 5)) {
                        this.addPillar(rowIndex + 1, cellSize);
                    } else {
                        backgroundLayer.appendChild(document.createElement('div'));
                        this.elementArray.push([null, 'nullSpace']);
                    }
            } else {
                const absoluteIndex = columnIndex < this.sideWidth ? Math.abs(columnIndex + 1 - this.columns) : columnIndex;
                let density = (absoluteIndex - (this.sideWidth + 6)) / this.sideWidth;
                if ((rowIndex === this.rows - 1 || rowIndex === 0) && !isMobile) {
                    density = .5;
                }

                if (getRandomInt(0, 100) > density * 100) {
                    this.addPillar(rowIndex + 1, cellSize);
                } else {
                    this.addEmptySpace();
                }
            }

            if (columnIndex === this.columns - 1) {
                columnIndex = 0;
                rowIndex++;
            } else {
                columnIndex++;
            }
        }

        for (let i = 0; i < this.elementArray.length; i++) {
            this.wobbleArray.push(i);
        }
    },

    powerOn: false,
    // Called when central button is clicked
    // Triggers power on sequence or display refresh depending on state
    click() {
        if (this.buttonLockout) {
            return;
        }
        this.buttonLockout = true;

        this.lowerButton();
        if (!this.powerOn) {
            this.powerOn = true;
            weatherConsole.raiseConsole();
        } else if (this.refreshEnabled) {
            this.refresh();
        } else {
            weatherConsole.fetchWeather();
        }
    },

    async lowerButton() {
        this.roundButton.classList.add('lowered');

        await new Promise(res => setTimeout(res, 300));
        this.roundButton.classList.add('closeDoors', 'zAdjust');
    },

    async raiseButton(buttonGlyph) {
        this.roundButton.classList.remove('powerGlyph', 'refreshGlyph', 'searchGlyph');
        this.roundButton.classList.add(buttonGlyph);
        this.roundButton.classList.remove('closeDoors');

        await new Promise(res => setTimeout(res, 100));
        this.roundButton.classList.remove('lowered');

        await new Promise(res => setTimeout(res, 500));
        this.roundButton.classList.remove('zAdjust');
        this.buttonLockout = false;
    },

    // Alternates state and display of pillars randomly
    // Called when displaying weather data
    wobbleArray: [],
    wobbling: false,
    wobble(delay) {
        if (!this.wobbling) {
            return;
        } else if (this.wobbleArray.length === 0) {
            setTimeout(() => {
                this.wobble(delay);
            }, delay);
            console.log('wobble array empty');
            return;
        }

        const randomIndex = getRandomInt(0, this.wobbleArray.length - 1);
        const wobbleIndex = this.wobbleArray[randomIndex];
        if (this.elementArray[wobbleIndex][1] != 'pillarSpace') {
            this.wobbleArray.splice(randomIndex, 1);
            this.wobble(delay);
            return;
        }

        this.wobbleArray.splice(randomIndex, 1);

        if (!this.elementArray[wobbleIndex][0].classList.contains('raised')) {
            this.changePillarState(wobbleIndex, 'raised');
        }

        setTimeout(() => {
            this.changePillarState(wobbleIndex, 'collapsed');
            setTimeout(() => {
                this.wobbleArray.push(wobbleIndex);
            }, 1000);
        }, 1000);

        setTimeout(() => {
            this.wobble(delay);
        }, delay);
    },
    
    changePillarState(index, state = null, delay = 0) {
        const element = this.elementArray[index][0];

        setTimeout(() => {
            element.classList.remove('collapsed', 'raised', 'default');
            element.classList.add(state);
        }, delay);
    },

    // Creates pillar element and adds it to the DOM
    addPillar(zindex, cellSize) {
        const backgroundLayer = document.querySelector('.backgroundLayer');
    
        const container = document.createElement('div');
        container.classList.add('boxContainer', 'default');
        container.style['z-index'] = zindex;
        const randomScale = getRandomInt(9, 12) / 10 * (cellSize / defaultCellSize);
        container.style.transform = `scale(${randomScale})`;
        container.style.left = isMobile ? `${-100 * (cellSize / defaultCellSize)}px` : `${(-20) * randomScale}px`;

        switch(getRandomInt(1, 3)) {
            case 1:
                container.classList.add('collapsed');
                break;
            case 2:
                break;
            case 3:
                container.classList.add('raised');
                break;
        }

        const pillarBackground = document.createElement('div');
        pillarBackground.classList.add('pillarBackground');
        container.appendChild(pillarBackground);

        const overflowContainer = document.createElement('div');
        overflowContainer.classList.add('overflowContainer', 'pillarContainer');
        container.appendChild(overflowContainer);

        const pillar = document.createElement('div');
        pillar.classList.add('pillar');
    
        switch(getRandomInt(1, 4)) {
            case 1:
                pillar.classList.add('pillarV1');
                break;
            case 2:
                pillar.classList.add('pillarV2');
                break;
            case 3:
                pillar.classList.add('pillarV3');
                break;
            case 4:
                pillar.classList.add('pillarV4');
                break;
            default:
                pillar.classList.add('pillarV1');
        }
    
        const pillarFace = document.createElement('div');
        pillarFace.classList.add('pillarFace');
        pillar.appendChild(pillarFace);
    
        overflowContainer.appendChild(pillar);

        const pillarBase = document.createElement('div');
        pillarBase.classList.add('pillarBase');
        container.appendChild(pillarBase);
        
        const foliage = document.createElement('div');
        switch(getRandomInt(1, 10)) {
            case 1:
                break;
            case 2:
                foliage.classList.add('foliage', 'grassOne');
                break;
            case 3:
                foliage.classList.add('foliage', 'weedOne');
                break;
            case 4:
                foliage.classList.add('foliage', 'grassTwo');
                break;
            case 5:
                foliage.classList.add('foliage', 'weedTwo');
                break;
            default:
                break;
        }
        foliage.style.bottom = `${getRandomInt(0, 12)}px`;
        foliage.style.left = `${getRandomInt(-60, 10) + 30}px`;
        container.appendChild(foliage);
    
        backgroundLayer.appendChild(container);

        this.elementArray.push([container, 'pillarSpace']);
    },
    
    bigRockCount: 0,
    addEmptySpace() {
        const backgroundLayer = document.querySelector('.backgroundLayer');
    
        const container = document.createElement('div');
        container.classList.add('boxContainer');
        
        const detail = document.createElement('div');
        let type = 'none';
        switch(getRandomInt(1, 10)) {
            case 1:
                break;
            case 2:
                type = 'foliage';
                detail.classList.add('foliage', 'grassOne');
                break;
            case 3:
                type = 'foliage';
                detail.classList.add('foliage', 'weedOne');
                break;
            case 4:
                type = 'foliage';
                detail.classList.add('foliage', 'grassTwo');
                break;
            case 5:
                type = 'foliage';
                detail.classList.add('foliage', 'weedTwo');
                break;
            case 6:
                type = 'rock';
                detail.classList.add('rock', 'rockOne');
                break;
            case 7:
                type = 'rock';
                detail.classList.add('rock', 'rockTwo');
                break;
            default:
                break;
        }

        if (type === 'foliage') {
            detail.style.bottom = `${getRandomInt(0, 12)}px`;
            detail.style.left = `${getRandomInt(-60, 10) + 30}px`;
        } else if (type === 'rock') {
            detail.style.bottom = `${getRandomInt(-20, 10)}px`;
            detail.style.transform = getRandomInt(0, 1) ? `rotateY(180deg) rotate(${getRandomInt(-10, 10)}deg) scale(${getRandomInt(10, 15) / 10})` 
                : `rotateY(0deg) rotate(${getRandomInt(-10, 10)}deg) scale(${getRandomInt(10, 15) / 10})`;
        }
        
        container.appendChild(detail);
    
        backgroundLayer.appendChild(container);
        this.elementArray.push([container, 'emptySpace']);
    },

    elementArray: [],

    refreshEnabled: false,
    async enableRefresh() {
        this.refreshEnabled = true;

        await new Promise(res => setTimeout(res, 1500));
        this.raiseButton('refreshGlyph');
    },

    // Refresh display so the user can search a different location
    refresh() {
        if (!this.refreshEnabled) {
            return;
        }

        // weatherConsole.changeCircuitState('pulsing');
        weatherConsole.disableWeatherEffects();

        weatherConsole.displayText('Where would you like to look? \n \n');
        setTimeout(() => {
            weatherConsole.enableInput();
        }, 500);
    },

    // Change the weather glyph displayed on the pillars
    changePillarGlyphs(imgUrl) {
        for (let space of this.elementArray) {
            if (space[1] === 'pillarSpace') {
                const face = space[0].querySelector('.pillar').querySelector('.pillarFace');
                space[0].classList.add('weatherGlyph');
                face.style['background-image'] = `url(${imgUrl})`;
            }
        }
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

initializePage();