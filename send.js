var SerialPort = require('serialport')
var serialport = new SerialPort(process.env.SKETCH_RNN_GCODE_PORT, 115200)
const http = require('http')
const port = 3000

const Readline = require('@serialport/parser-readline')
const parser = serialport.pipe(new Readline({ delimiter: '\r\n' }))

var trajectory = []
var idle = true

var drawnext = () => {
  var point = trajectory.shift()
  console.log('NEXT POINT =====> ' + point)
  console.log('Left in queue: ' + trajectory.length)
  serialport.write(point + '\n')
  idle = false
}

serialport.on('open', function() {
  console.log('Serial Port Opened')
  parser.on('data', function(data) {
      data = data.toString('utf8')
      if (data != 'ok') console.log('Board: ' + data)

      if (data.startsWith('<Idle')) {
        idle = true
      } else if (data.startsWith('<Run')) {
        idle = false
      }
  })
})


var statusupdate = () => {
  var statustimer = setInterval(loop, 1000)

  function loop() {
    if (idle && trajectory.length > 0) {
      drawnext()
    } else if (!idle) {
      serialport.write('?\n')
    }
  }

  loop()
}

statusupdate()

const requestHandler = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'POST') {
    let body = ''
    req.on('data', chunk => {
        body += chunk.toString()
    })
    req.on('end', () => {
      trajectory.push(...body.split('\n'))
      res.end('ok')
    })
    return
  }
  if ( req.method === 'OPTIONS' ) {
		res.writeHead(200)
		res.end()
		return
	}
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
})
