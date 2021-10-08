/**
 * Wraps words in a text with a given width.
 * @param  {string} text  The text to wrap. This text can be multiline.
 * @param  {int}    width Width of the text. Default = 79.
 * @return {string} The wrapped text.
 */
var text_wrap = function (text, width) {
  width = width || 79; 

  lines = text.split("\r\n");

  return lines
    .map(function (line){
      return line_wrap(line, width);
    })
    .join("\r\n");    
}

/**
 * Wraps words in a line with a ligen width.
 * @param  {string} text  The line to wrap.
 * @param  {int}    width Width of the text. Default = 79.
 * @return {string} The wrapped text.
 */
var line_wrap = function (text, width) {
  width = width || 79; 

  var return_text = "";
  var words = text.split(' ');
  var line = "";

  words.forEach(function(word) {
    
    if ((line.length + word.length) > width) {
      return_text += "\r\n";
      line = "";
    }

    return_text += (line.length == 0 ? "" : " ") + word;
    line += (line.length == 0 ? "" : " ") + word;
  });

  return return_text;
}

/**
 * Visually formats a timestamp.
 * @param  {int}    ms The time in miliseconds
 * @return {string} The time in a verbose, human-friendly way
 */
var friendly_time = function(ms) {
  let msec, sec, min, hour, day, month, year;
  msec = Math.floor(ms % 1000);
  sec = Math.floor((ms / 1000) % 60);
  min = Math.floor((ms / 1000 / 60) % 60);
  hour = Math.floor((ms / 1000 / 60 / 60) % 24);
  day = Math.floor((ms / 1000 / 60 / 60 / 24) % 30);
  month = Math.floor((ms / 1000 / 60 / 60 / 24 / 30) % 12);
  year = Math.floor((ms / 1000 / 60 / 60 / 24 / 30 / 12));
  let f_time = "";
  if (msec) {
    f_time = msec + " millisecond";
    if (msec > 1) f_time += "s";
  }
  if (sec) {
    f_time = sec + " second";
    if (sec > 1) f_time += "s";
  }
  if (min) {
    f_time = min + " minute";
    if (min > 1) f_time += "s";
  }
  if (hour) {
    var quantity = (hour > 1) ? "s" : "";
    f_time = hour + " hour" + quantity + ", " + f_time;
  }
  if (day) {
    var quantity = (day > 1) ? "s" : "";
    f_time = day + " day" + quantity + ", " + f_time;
  }
  if (month) {
    var quantity = (month > 1) ? "s" : "";
    f_time = month + " month" + quantity + ", " + f_time;
  }
  if (year) {
    var quantity = (year > 1) ? "s" : "";
    f_time = year + " year" + quantity + ", " + f_time;
  }
  return f_time;
}

let colorize = function(str) {
  const colors = {
    RS: "\033[0m", /* reset */
    OL: "\033[1m", /* bold */
    UL: "\033[4m", /* underline */
    LI: "\033[5m", /* blink */
    RV: "\033[7m", /* reverse */
    /* Foreground colour */
    FK: "\033[30m", /* black */
    FR: "\033[31m", /* red */
    FG: "\033[32m", /* green */
    FY: "\033[33m", /* yellow */
    FB: "\033[34m", /* blue */
    FM: "\033[35m", /* magenta */
    FC: "\033[36m", /* cyan */
    FW: "\033[37m", /* white */
    /* Background colour */
    BK: "\033[40m", /* black */
    BR: "\033[41m", /* red */
    BG: "\033[42m", /* green */
    BY: "\033[43m", /* yellow */
    BB: "\033[44m", /* blue */
    BM: "\033[45m", /* magenta */
    BC: "\033[46m", /* cyan */
    BW: "\033[47m", /* white */
    /* Some compatibility names */
    FT: "\033[36m", /* cyan AKA turquoise */
    BT: "\033[46m", /* cyan AKA turquoise */
  };

  if (typeof str === 'object') {
    return str;
  }

  str = str.replace(/(\^?~([A-Z]{2}))/g, (match, p1, p2, offset, inputString) => {
    if (p1[0] === '^' || !colors.hasOwnProperty(p2)) {
      return p1.substr(1);
    }
    return colors[p2];
  });

  str = str.replace(/(\^?~([FB])(\d{1,3}))/g, (match, p1, p2, p3, offset, inputString) => {
    if (p1[0] === '^') {
      return p1.substr(1);
    }
    let fb = p2 === 'F' ? 38 : 48;
    return "\033[" + `${fb};5;${p3}m`;
  });

  return str;
}

let monotone = function(str) {
  if (typeof str === 'object') {
    return str;
  }

  str = str.replace(/(\^?~([A-Z]{2}))/g, (match, p1, p2, offset, inputString) => {
    return (p1[0] === '^' ? p1.substr(1) : '');
  });

  str = str.replace(/(\^?~([FB])(\d{1,3}))/g, (match, p1, p2, p3, offset, inputString) => {
    return (p1[0] === '^' ? p1.substr(1) : '');
  });

  return str;
}

module.exports = {
  text_wrap: text_wrap,
  line_wrap: line_wrap,
  friendly_time: friendly_time,
  colorize: colorize,
  monotone: monotone
}
