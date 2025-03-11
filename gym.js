//datos

    const postData = JSON.stringify({
        user: "jdomenech@edicomgroup.com",
        pass: "cccccccc",
        tokenKiosco: ""
    });

//Este por ejemplo comprobará Martes y Jueves
//y el horario que se quiere reservar
const horas = [
  ["", ""],  		   // Lunes
  ["07:30", "08:15"],  // Martes
  ["", ""],  		   // Miércoles
  ["07:30", "08:15"],  // Jueves
  ["", ""],  		   // Viernes
  ["", ""],  		   // Sábado
  ["", ""]   		   // Domingo
];


const https = require('https');


function obtenerProximoDia(diafinal) {
  const hoy = new Date();
  const diaActual = hoy.getDay();
 

  const diasHastaObjetivo = (diafinal - diaActual + 7) % 7;


  hoy.setDate(hoy.getDate() + (diasHastaObjetivo === 0 ? 7 : diasHastaObjetivo));

  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');

  return `${año}-${mes}-${dia}`;
}


function encuentraClase(data, hora_inicio, hora_final) {
    let clase = null;

    data.forEach(day => {
        day.schedules.forEach(schedule => {
            if (schedule.timeStart === hora_inicio && schedule.timeEnd === hora_final) {
                if (schedule.bookingInfo.isReservable) {
                    clase = schedule.id;
                }
            }
        });
    });

    return clase;
}

function login(callback) {
    const options = {
        hostname: 'trainingymapp.com',
        port: 443,
        path: '/webtouch/api/indexs/login',
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json;charset=UTF-8',
            'Origin': 'https://trainingymapp.com',
            'Referer': 'https://trainingymapp.com/webtouch/',
        }
    };



    const req = https.request(options, (res) => {
        let cookies = res.headers['set-cookie'];
        let data = '';

        res.on('data', chunk => {
            data += chunk;
        });

        res.on('end', () => {
            callback(cookies);
        });
    });

    req.on('error', (e) => {
        console.error(`Error en login: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

function horarios(cookies, dia_seleccionado) {
  return new Promise((resolve, reject) => {
    const startDateTime = new Date(dia_seleccionado);
    const endDateTime = new Date(startDateTime);
    endDateTime.setDate(startDateTime.getDate() + 1); // Establecemos el rango de un día después

    const options = {
      hostname: 'trainingymapp.com',
      port: 443,
      // Usamos comillas invertidas para interpolar las fechas
      path: `/webtouch/api/usuarios/reservas/getSchedulesApp/?startDateTime=${startDateTime.toISOString()}&endDateTime=${endDateTime.toISOString()}&noCache=${Math.random()}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://trainingymapp.com/webtouch/actividades',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Cookie': cookies.join('; ')  // Pasamos las cookies obtenidas en el login
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          // Devolvemos los datos en formato JSON si es posible
          resolve(JSON.parse(data));
        } catch (error) {
          reject('Error al parsear los datos: ' + error.message);
        }
      });
    });

    req.on('error', (e) => {
      reject(`Error al obtener horarios: ${e.message}`);
    });

    req.end();
  });
}


function reserva(cookies, codigo_clase) {
    const options = {
        hostname: 'trainingymapp.com',
        port: 443,
        path: `/webtouch/api/usuarios/reservas/bookTouch/${codigo_clase}?noCache=${Math.random()}`,
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json;charset=UTF-8',
            'Origin': 'https://trainingymapp.com',
            'Referer': 'https://trainingymapp.com/webtouch/actividades',
            'Cookie': cookies.join('; ')  
        }
    };

    const postData = JSON.stringify({});

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', chunk => {
            data += chunk;
        });

        res.on('end', () => {
        });
    });

    req.on('error', (e) => {
    });

    req.write(postData);  
    req.end();
}



  const dia_comprobar = new Date().getDay(); 
  const dia_comprobar_ajustado = (dia_comprobar === 0) ? 7 : dia_comprobar;
  const [horaInicio, horaFin] = horas[dia_comprobar_ajustado - 1];

  if (horaInicio && horaFin) {


 login((cookies) => {
    if (cookies) {
const proximoDiaBusc = obtenerProximoDia( dia_comprobar_ajustado );
horarios(cookies, proximoDiaBusc)
  .then(data => {
const result = encuentraClase(data.calendar, horaInicio, horaFin);
console.log(result);
if (result !== null && result !== undefined && result !== '') {
reserva(cookies, result);
}
  })
  .catch(error => {
    console.error('Error:', error);
  });

    }
});
} else {
  console.log("El script NO debe ejecutarse hoy.");
}



