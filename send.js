var enablePrinter = true

const http = require('http')
const port = 3000

var fs = require("fs");

var trajectory = []
var idle = true

var call_back = null
var last_drawn = new Date()
var positioned_back = false
var home_point = ['G1 Z-5 F2000', 'G0 X-20 Y-70']

if (enablePrinter) {
  var SerialPort = require('serialport')
  var serialport = new SerialPort(process.env.SKETCH_RNN_GCODE_PORT, {
    baudRate: 115200
  })
  const Readline = require('@serialport/parser-readline')
  const parser = serialport.pipe(new Readline({ delimiter: '\r\n' }))

  serialport.on('open', function() {
    console.log('Serial Port Opened')

    setTimeout(() => {
      serialport.write('$X\n')
      serialport.write('$H\n')
    }, 3000)

    parser.on('data', function(data) {
        data = data.toString('utf8')
        if (!data.startsWith('[HLP:$$')) {
          console.log('Board: ' + data)
        }
        if (data == 'ok' && trajectory.length) {
          drawnext()
        }


        if (data.startsWith('<Idle')) {
          call_back ? call_back(true) : null
        } else if (data.startsWith('<Run')) {
          call_back ? call_back(false) : null
        }
    })
  })

  var drawnext = () => {
    var point = trajectory.shift()
    console.log('NEXT POINT =====> ' + point)
    console.log('Left in queue: ' + trajectory.length)
    serialport.write(point + '\n')
    idle = false
    if (!home_point.includes(point)) {
      last_drawn = new Date()
      positioned_back = false
    }
  }

  var update = () => {
    var statustimer = setInterval(loop, 10000)

    function loop() {
      if ((new Date()).getTime() - last_drawn.getTime() > 30000 && !positioned_back) {
        trajectory.push(...home_point)
        positioned_back = true
        drawnext()
      }
    }
  }

  update()

}


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
      if (enablePrinter) {
        trajectory.push(...body.split('\n'))
        drawnext()
      }
      res.end('ok')
    })
    return
  }
  if ( req.method === 'OPTIONS' ) {
		res.writeHead(200)
		res.end()
		return
	}
  if (req.method === 'GET' && req.url.startsWith('/model')) {
    var model = req.url.replace('%20', '_').substring(6)
    console.log('Requested model ' + model)
    try {
      var contents = fs.readFileSync(`./models/${model}`, 'utf8');
      console.log('Finished reading')
      res.write(contents)
    } catch (err) {
      console.log(err)
      res.write('')
    }
    res.end()
    return
  }

  if (req.method === 'GET' && req.url === '/update') {
    var status = 'ko'
    if (enablePrinter) {
      if (trajectory.length === 0) {
        call_back = (status) => {
          call_back = null
          res.write(status ? 'ok' : 'ko')
          res.end()
          console.log(`status: ${status ? 'ok' : 'ko'}`)
        }
        console.log('Sending status...')
        serialport.write('$?\n')
      } else {
        console.log(`status: ${status}`)
        res.write(status)
        res.end()
      }
    } else {
      status = 'ok'
      console.log(`status: ${status}`)
      res.write(status)
      res.end()
    }
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
