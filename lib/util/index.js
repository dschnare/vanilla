/**
 * Create a new plain old javascript object while ensuring
 * the properties on the specified 'defaults' object
 * have been set on 'o'. Properties on 'o' and 'defaults'
 * will be shallow copied to a new object and returned.
 */
exports.pojo = function (o, defaults) {
  var k, v, t, obj;
  
  // Ensure the arguments are valid objects.
  if (Object(o) !== o) o = {};
  if (Object(defaults) !== defaults) defaults = {};
  
  // Create the new object that will recieve a shallow
  // copy of the properties from 'o' and 'defaults'.
  obj = {};
  
  // Iterate over the properties of 'defaults'.
  for (k in defaults) {
    v = defaults[k];
    t = o[k];
    
    // If both properties in 'o' and 'defaults' are
    // pojos then we recursively call this function
    // and save the result on obj.
    if (Object(v) === v && Object(t) === t) {
      obj[k] = exports.pojo(t, v);
    // Otherwise if 'o' does not have this property
    // we save it on obj.
    } else if (t === undefined) {
      obj[k] = v;
    }
  }
  
  // Save each property of 'o' that doesn't exist on obj
  for (k in o) {
    if (obj[k] === undefined) {
      obj[k] = o[k];
    }
  }
  
  return obj;
};

exports.getLineWithIndex = function (string, index) {
  var c, start, end, i;
  
  c = string.charAt(index);
  start = index;
  
  while (start && c) {
    if (c === '\n' || !c) {
      start += 1;
      break;
    } else {
      start -= 1;
      c = string.charAt(start);
    }
  }
  
  c = string.charAt(index);
  end = index;
  
  while (c) {
    if (c === '\n' || !c) {
      break;
    } else {
      end += 1;
      c = string.charAt(end);
    }
  }

  return {
    start: start,
    end: end
  };
};

exports.replaceLine = function (text, line, replacement) {
  return text.substring(0, line.start) + (replacement || '') + '\n' + text.substring(line.end);  
};