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

module.exports = {
  text_wrap: text_wrap,
  line_wrap: line_wrap
}