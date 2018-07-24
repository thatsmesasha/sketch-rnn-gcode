// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied. See the License for the specific language governing
// permissions and limitations under the License.
/**
 * Author: David Ha <hadavid@google.com>
 *
 * @fileoverview Basic p5.js sketch to show how to use sketch-rnn
 * to finish the user's incomplete drawing, and loop through different
 * endings automatically.
 */
var sketch = function( p ) {
  "use strict";

  var small_class_list = ['ant',
    'antyoga',
    'alarm_clock',
    'ambulance',
    'angel',
    'backpack',
    'barn',
    'basket',
    'bear',
    'bee',
    'beeflower',
    'bicycle',
    'bird',
    'book',
    'brain',
    'bridge',
    'bulldozer',
    'bus',
    'butterfly',
    'cactus',
    'calendar',
    'castle',
    'cat',
    'catbus',
    'catpig',
    'chair',
    'couch',
    'crab',
    'crabchair',
    'crabrabbitfacepig',
    'cruise_ship',
    'diving_board',
    'dog',
    'dogbunny',
    'dolphin',
    'duck',
    'elephant',
    'elephantpig',
    'eye',
    'face',
    'fan',
    'fire_hydrant',
    'firetruck',
    'flamingo',
    'flower',
    'floweryoga',
    'frog',
    'frogsofa',
    'garden',
    'hand',
    'hedgeberry',
    'hedgehog',
    'helicopter',
    'kangaroo',
    'key',
    'lantern',
    'lighthouse',
    'lion',
    'lionsheep',
    'lobster',
    'map',
    'mermaid',
    'monapassport',
    'monkey',
    'mosquito',
    'octopus',
    'owl',
    'paintbrush',
    'palm_tree',
    'parrot',
    'passport',
    'peas',
    'penguin',
    'pig',
    'pigsheep',
    'pineapple',
    'pool',
    'postcard',
    'power_outlet',
    'rabbit',
    'rabbitturtle',
    'radio',
    'radioface',
    'rain',
    'rhinoceros',
    'rifle',
    'roller_coaster',
    'sandwich',
    'scorpion',
    'sea_turtle',
    'sheep',
    'skull',
    'snail',
    'snowflake',
    'speedboat',
    'spider',
    'squirrel',
    'steak',
    'stove',
    'strawberry',
    'swan',
    'swing_set',
    'the_mona_lisa',
    'tiger',
    'toothbrush',
    'toothpaste',
    'tractor',
    'trombone',
    'truck',
    'whale',
    'windmill',
    'yoga',
    'yogabicycle'];

  var large_class_list = ['ant',
    'ambulance',
    'angel',
    'alarm_clock',
    'antyoga',
    'backpack',
    'barn',
    'basket',
    'bear',
    'bee',
    'beeflower',
    'bicycle',
    'bird',
    'book',
    'brain',
    'bridge',
    'bulldozer',
    'bus',
    'butterfly',
    'cactus',
    'calendar',
    'castle',
    'cat',
    'catbus',
    'catpig',
    'chair',
    'couch',
    'crab',
    'crabchair',
    'crabrabbitfacepig',
    'cruise_ship',
    'diving_board',
    'dog',
    'dogbunny',
    'dolphin',
    'duck',
    'elephant',
    'elephantpig',
    'everything',
    'eye',
    'face',
    'fan',
    'fire_hydrant',
    'firetruck',
    'flamingo',
    'flower',
    'floweryoga',
    'frog',
    'frogsofa',
    'garden',
    'hand',
    'hedgeberry',
    'hedgehog',
    'helicopter',
    'kangaroo',
    'key',
    'lantern',
    'lighthouse',
    'lion',
    'lionsheep',
    'lobster',
    'map',
    'mermaid',
    'monapassport',
    'monkey',
    'mosquito',
    'octopus',
    'owl',
    'paintbrush',
    'palm_tree',
    'parrot',
    'passport',
    'peas',
    'penguin',
    'pig',
    'pigsheep',
    'pineapple',
    'pool',
    'postcard',
    'power_outlet',
    'rabbit',
    'rabbitturtle',
    'radio',
    'radioface',
    'rain',
    'rhinoceros',
    'rifle',
    'roller_coaster',
    'sandwich',
    'scorpion',
    'sea_turtle',
    'sheep',
    'skull',
    'snail',
    'snowflake',
    'speedboat',
    'spider',
    'squirrel',
    'steak',
    'stove',
    'strawberry',
    'swan',
    'swing_set',
    'the_mona_lisa',
    'tiger',
    'toothbrush',
    'toothpaste',
    'tractor',
    'trombone',
    'truck',
    'whale',
    'windmill',
    'yoga',
    'yogabicycle'];

  var use_large_models = true;

  var class_list = small_class_list;

  if (use_large_models) {
    class_list = large_class_list;
  }

  // sketch_rnn model
  var model;
  var model_data;
  var temperature = 0.2;
  var min_sequence_length = 5;

  var model_pdf; // store all the parameters of a mixture-density distribution
  var model_state, model_state_orig;
  var model_prev_pen;
  var model_dx, model_dy;
  var model_pen_down, model_pen_up, model_pen_end;
  var model_x, model_y;
  var model_is_active;

  var ai_turn;
  var human_turn;

  // variables for the sketch input interface.
  var pen;
  var prev_pen;
  var x, y; // absolute coordinates on the screen of where the pen is
  var start_x, start_y;
  var has_started; // set to true after user starts writing.
  var just_finished_line;
  var epsilon = 2.0; // to ignore data from user's pen staying in one spot.
  var raw_lines;
  var current_raw_line;
  var strokes;
  var line_color, predict_line_color;

  // UI
  var screen_width, screen_height, temperature_slider;
  var line_width = 10.0;
  var screen_scale_factor = 3.0;

  // dom
  var canvas;
  var reset_button, model_sel, random_model_button;
  var ai_button, print_button;
  var text_title, text_temperature;

  var title_text;

  var canvas_width, canvas_height;
  var canvas_margin;

  var started_printing;
  var x_print, y_print;

  // scaling coordinates

  var leftx = -325;
  var rightx = -81;

  var upy = -104;
  var downy = -288;

  var abovetopz = -5;
  var topz = -70;
  var bottomz = -79;

  var slider_gcode = `G1 Z${abovetopz} F2000\nG0 X-342 Y-340\nG1 Z-61 F2000\nG1 X-72 F4000\nG1 X-342 F4000\nG1 Z${abovetopz} F2000`

  if (leftx == rightx || downy == upy) {
    throw Error(`Invalid coordinates: leftx: ${leftx} rightx: ${rightx} upy: ${upy} downy: ${downy}`)
  }

  var set_title_text = function(new_text) {
    title_text = new_text.split('_').join(' ');
    text_title.html(title_text);
    text_title.position(220+canvas_margin + canvas_width/2 - new_text.length * 11, 0);
  };

  var update_temperature_text = function() {
    var the_color="rgba("+Math.round(255*temperature)+",0,"+255+",1)";
    text_temperature.style("color", the_color); // ff990a
    text_temperature.html(""+Math.round(temperature*100));
  };

  var draw_example = function(example, start_x, start_y, line_color) {
    var i;
    var x=start_x, y=start_y;
    var dx, dy;
    var pen_down, pen_up, pen_end;
    var prev_pen = [1, 0, 0];

    for(i=0;i<example.length;i++) {
      // sample the next pen's states from our probability distribution
      [dx, dy, pen_down, pen_up, pen_end] = example[i];

      if (prev_pen[2] == 1) { // end of drawing.
        break;
      }

      // only draw on the paper if the pen is touching the paper
      if (prev_pen[0] == 1) {
        p.stroke(line_color);
        p.strokeWeight(line_width);
        p.line(x, y, x+dx, y+dy); // draw line connecting prev point to current point.
      }

      // update the absolute coordinates from the offsets
      x += dx;
      y += dy;

      // update the previous pen's state to the current one we just sampled
      prev_pen = [pen_down, pen_up, pen_end];
    }

  };

  var init = function() {

    // model
    ModelImporter.set_init_model(model_raw_data);
    if (use_large_models) {
      ModelImporter.set_model_url("https://storage.googleapis.com/quickdraw-models/sketchRNN/large_models/");
    }
    model_data = ModelImporter.get_model_data();
    model = new SketchRNN(model_data);
    model.set_pixel_factor(screen_scale_factor);

    screen_width = p.windowWidth; //window.innerWidth
    screen_height = p.windowHeight; //window.innerHeight

    canvas_height = screen_height - 100;
    canvas_width = Math.abs(canvas_height * (rightx - leftx) / (downy - upy));

    // dom

    var stylebutton = (button, color) => {
      button.style('font-family', 'Cabin Sketch')
      button.style('font-size', '50px')
      button.style('color', color)
      button.style('outline', 'none')
      button.style('border', 'none')
      button.elt.style.width = '200px'
    }

    reset_button = p.createButton('new');
    reset_button.position(50, screen_height * 0.2 - 25);
    reset_button.mousePressed(reset_button_event); // attach button listener
    stylebutton(reset_button, '#f176c3')

    // random model buttom
    random_model_button = p.createButton('random');
    random_model_button.position(50, screen_height * 0.5 - 25);
    random_model_button.mousePressed(random_model_button_event); // attach button listener
    stylebutton(random_model_button, '#7cdfff')

    // ai drawing
    ai_button = p.createButton('ai turn');
    ai_button.position(50, screen_height * 0.8 - 25);
    ai_button.mousePressed(ai_button_event); // attach button listener
    stylebutton(ai_button, '#91d832')

    // printing
    // print_button = p.createButton('print');
    // print_button.position(10, 10);
    // print_button.mousePressed(print_button_event); // attach button listener

    //canvas =
    canvas = p.createCanvas(canvas_width, canvas_height);
    canvas.canvas.style.border = 'dotted 10px #5a5655'
    canvas_margin = Math.max(0, (screen_width - canvas_width - 220) / 2)
    canvas.canvas.style.margin = `40px ${220 + canvas_margin}px ${canvas_margin}px`
    // canvas.canvas.style.float = 'right'
    canvas.canvas.style.display = 'block'

    // title
    text_title = p.createP();
    text_title.style("font-family", "Cabin Sketch");
    text_title.style("font-size", "50px");
    text_title.style("position", "absolute");
    text_title.style("color", "#ff990a");
    set_title_text('draw '+model.info.name+'.');

    // turns
    ai_turn = false;
    human_turn = true;


    // drawing
    strokes = [];
  };

  var encode_strokes = function(sequence) {

    model_state_orig = model.zero_state();

    if (sequence.length <= min_sequence_length) {
      return;
    }

    // encode sequence
    model_state_orig = model.update(model.zero_input(), model_state_orig);
    for (var i=0;i<sequence.length-1;i++) {
      model_state_orig = model.update(sequence[i], model_state_orig);
    }

    restart_model(sequence);

    // model_is_active = true;

  }

  var restart_model = function(sequence) {

    model_state = model.copy_state(model_state_orig); // bounded

    var idx = raw_lines.length-1;
    var last_point = raw_lines[idx][raw_lines[idx].length-1];
    var last_x = last_point[0];
    var last_y = last_point[1];

    // individual models:
    var sx = last_x;
    var sy = last_y;

    var dx, dy, pen_down, pen_up, pen_end;
    var s = sequence[sequence.length-1];

    model_x = sx;
    model_y = sy;

    dx = s[0];
    dy = s[1];
    pen_down = s[2];
    pen_up = s[3];
    pen_end = s[4];

    model_dx = dx;
    model_dy = dy;
    model_prev_pen = [pen_down, pen_up, pen_end];

  }

  var restart = function() {

    // reinitialize variables before calling p5.js setup.
    line_color = p.color(p.random(64, 224), p.random(64, 224), p.random(64, 224));
    predict_line_color = p.color(p.random(64, 224), p.random(64, 224), p.random(64, 224));

    // make sure we enforce some minimum size of our demo
    screen_width = Math.max(window.innerWidth, 480);
    screen_height = Math.max(window.innerHeight, 320);

    // variables for the sketch input interface.
    pen = 0;
    prev_pen = 1;
    has_started = false; // set to true after user starts writing.
    just_finished_line = false;
    raw_lines = [];
    current_raw_line = [];
    strokes = [];
    // start drawing from somewhere in middle of the canvas
    x = canvas_width/2.0;
    y = canvas_height/2.0;
    start_x = x;
    start_y = y;
    x_print = start_x;
    y_print = start_y;
    has_started = false;
    started_printing = false;

    model_x = x;
    model_y = y;
    model_prev_pen = [0, 1, 0];
    model_is_active = false;

    // send_to_server(slidergcode)

  };

  var clear_screen = function() {
    p.background(255, 255, 255, 255);
    p.fill(255, 255, 255, 255);
  };

  p.setup = function() {
    init();
    restart();
    p.frameRate(60);
    clear_screen();
    console.log('ready.');
  };

  // tracking mouse  touchpad
  var tracking = {
    down: false,
    x: 0,
    y: 0
  };

  p.draw = function() {
    deviceEvent();
    // record pen drawing from user:
    if (tracking.down && (tracking.x > 0) && tracking.y < (screen_height-60)) { // pen is touching the paper
      if (has_started == false) { // first time anything is written
        has_started = true;
        x = tracking.x;
        y = tracking.y;
        start_x = x;
        start_y = y;
        x_print = x;
        y_print = y;
        pen = 0;
      }
      var dx0 = tracking.x-x; // candidate for dx
      var dy0 = tracking.y-y; // candidate for dy
      if (dx0*dx0+dy0*dy0 > epsilon*epsilon) { // only if pen is not in same area
        var dx = dx0;
        var dy = dy0;
        pen = 0;

        if (prev_pen == 0) {
          p.stroke(line_color);
          p.strokeWeight(line_width); // nice thick line
          p.line(x, y, x+dx, y+dy); // draw line connecting prev point to current point.
        }

        // update the absolute coordinates from the offsets
        x += dx;
        y += dy;

        // update raw_lines
        current_raw_line.push([x, y]);
        just_finished_line = true;

        // using the previous pen states, and hidden state, get next hidden state
        // update_rnn_state();
      }
    } else { // pen is above the paper
      pen = 1;
      if (just_finished_line) {
        var current_raw_line_simple = DataTool.simplify_line(current_raw_line);
        var idx, last_point, last_x, last_y;

        if (current_raw_line_simple.length > 1) {
          if (raw_lines.length === 0) {
            last_x = start_x;
            last_y = start_y;
          } else {
            idx = raw_lines.length-1;
            last_point = raw_lines[idx][raw_lines[idx].length-1];
            last_x = last_point[0];
            last_y = last_point[1];
          }
          var stroke = DataTool.line_to_stroke(current_raw_line_simple, [last_x, last_y]);
          raw_lines.push(current_raw_line_simple);
          strokes = strokes.concat(stroke);

          // initialize rnn:
          encode_strokes(strokes);

          // redraw simplified strokes
          clear_screen();
          console.log(strokes, start_x, start_y)
          print_job(stroke);
          draw_example(strokes, start_x, start_y, line_color);

          /*
          p.stroke(line_color);
          p.strokeWeight(2.0);
          p.ellipse(x, y, 5, 5); // draw line connecting prev point to current point.
          */

        } else {
          if (raw_lines.length === 0) {
            has_started = false;
          }
        }

        current_raw_line = [];
        just_finished_line = false;
      }

      // have machine take over the drawing here:
      if (ai_turn) {
        var trajectory = []
        do {

          model_pen_down = model_prev_pen[0];
          model_pen_up = model_prev_pen[1];
          model_pen_end = model_prev_pen[2];

          model_state = model.update([model_dx, model_dy, model_pen_down, model_pen_up, model_pen_end], model_state);
          model_pdf = model.get_pdf(model_state);
          [model_dx, model_dy, model_pen_down, model_pen_up, model_pen_end] = model.sample(model_pdf, temperature);
          trajectory.push([model_dx, model_dy, model_pen_down, model_pen_up, model_pen_end])

          if (model_pen_end === 1) {
            console.log('Done!')
            ai_turn = false;
            console.log(trajectory)
            print_job(trajectory)
          } else {

            // if (model_prev_pen[0] === 1) {
            //
            //   // draw line connecting prev point to current point.
            //   p.stroke(predict_line_color);
            //   p.strokeWeight(line_width);
            //   p.line(model_x, model_y, model_x+model_dx, model_y+model_dy);
            // }

            model_prev_pen = [model_pen_down, model_pen_up, model_pen_end];

            model_x += model_dx;
            model_y += model_dy;
          }

        } while (model_pen_end !== 1)

      }
    }
    prev_pen = pen;
  };


  var send_to_server = function(hand_trajectory) {
    var xhr = new XMLHttpRequest()
    var url = "http://localhost:3000"
    xhr.open("POST", url, true)
    xhr.setRequestHeader("Content-type", "text/plain")
    try {
      xhr.send(hand_trajectory)
    } catch(e) {
      console.err(e)
    }
  }

  var scalexy = function(x, y) {
    var height = downy - upy
    var width = rightx - leftx
    var proportion = height / width


    x = Math.max(Math.min(x, canvas_width), 0)
    y = Math.max(Math.min(y, canvas_height), 0)

    if (canvas_height / canvas_width > Math.abs(proportion)) {
      //vertical
      return { x: (leftx + rightx) / 2 - height / canvas_height * (x - canvas_width / 2),
               y: upy + y * height / canvas_height}
    } else {
      // horizontal
      return { x: leftx + x * width / canvas_width,
               y: (downy + upy) / 2 - width / canvas_width * (y - canvas_height / 2)}
    }
  }
  var print_job = function(trajectory) {
    var i;
    var prev_hand_pen_down = 1;
    var hand_trajectory = [`G1 Z${started_printing ? topz : abovetopz} F4000`];
    var hand_dx, hand_dy, hand_pen_down, hand_pen_up;
    var lifted = true
    var point;

    if (!trajectory.length) {
      return;
    }

    console.log('pj', trajectory, x_print, y_print)

    started_printing = true

    if (trajectory[trajectory.length - 1][4] == 1) {
      trajectory.pop()
    }


    for (i=0; i<trajectory.length; i++) {
      [hand_dx, hand_dy, hand_pen_down, hand_pen_up] = trajectory[i];
      x_print += hand_dx;
      y_print += hand_dy;

      point = scalexy(x_print, y_print)

      hand_trajectory.push(`G${lifted ? '0 ' : '1'} X${point.x} Y${point.y}${lifted ? '' : ' F4000'}`)
      if (prev_hand_pen_down == 0 && hand_pen_down == 1 || i == 0) {
        hand_trajectory.push(`G1 Z${bottomz} F4000`);
        lifted = false
      } else if (prev_hand_pen_down == 1 && hand_pen_up == 1) {
        hand_trajectory.push(`G1 Z${topz} F4000`);
        lifted = true
      }
      prev_hand_pen_down = hand_pen_down;
    }

    // console.log(trajectory)
    hand_trajectory = hand_trajectory.join('\n')
    console.log(hand_trajectory)
    send_to_server(hand_trajectory)

  }

  var model_sel_event = function() {
    var c = model_sel.value();
    var model_mode = "gen";
    console.log("user wants to change to model "+c);
    var call_back = function(new_model) {
      model = new_model;
      model.set_pixel_factor(screen_scale_factor);
      encode_strokes(strokes);
      clear_screen();
      draw_example(strokes, start_x, start_y, line_color);
      set_title_text('draw '+model.info.name+'.');
    }
    set_title_text('loading '+c+' model...');
    ModelImporter.change_model(model, c, model_mode, call_back);
  };

  var random_model_button_event = function() {
    var item = class_list[Math.floor(Math.random()*class_list.length)];
    var model_mode = "gen";
    console.log("user wants to change to model "+item);
    var call_back = function(new_model) {
      model = new_model;
      model.set_pixel_factor(screen_scale_factor);
      encode_strokes(strokes);
      clear_screen();
      draw_example(strokes, start_x, start_y, line_color);
      set_title_text('draw '+model.info.name+'.');
    }
    set_title_text('loading '+item+' model...');
    ModelImporter.change_model(model, item, model_mode, call_back);
  };

  var reset_button_event = function() {
    send_to_server(slider_gcode)
    restart();
    clear_screen();
  };

  var ai_button_event = function() {
    ai_turn = true;
  };

  var print_button_event = function() {
    print_job();
  };


  var deviceReleased = function() {
    "use strict";
    tracking.down = false;
  }

  var devicePressed = function(x, y) {
    if (y > 0 && y < canvas_height && x > 0 && x < canvas_width) {
      tracking.x = x;
      tracking.y = y;
      if (!tracking.down) {
        tracking.down = true;
      }
    }
  };

  var deviceEvent = function() {
    if (p.mouseIsPressed) {
      devicePressed(p.mouseX, p.mouseY);
    } else {
      deviceReleased();
    }
  }
};
var custom_p5 = new p5(sketch, 'sketch');
