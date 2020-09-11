// https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
function shadeColor(color, percent) {
  var R = parseInt(color.substring(1, 3), 16);
  var G = parseInt(color.substring(3, 5), 16);
  var B = parseInt(color.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  var RR = R.toString(16).length === 1 ? "0" + R.toString(16) : R.toString(16);
  var GG = G.toString(16).length === 1 ? "0" + G.toString(16) : G.toString(16);
  var BB = B.toString(16).length === 1 ? "0" + B.toString(16) : B.toString(16);

  return "#" + RR + GG + BB;
}

function main(uri) {
  function toDataURL(url, callback) {
    var xhr = new window.XMLHttpRequest();
    xhr.onload = function () {
      var reader = new window.FileReader();
      reader.onloadend = function () {
        callback(reader.result);
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.send();
  }

  toDataURL("https://i.scdn.co/image/" + uri, function (dataUrl) {
    var img = new window.Image();
    img.src = dataUrl;
    img.onload = function () {
      var colorThief = new window.ColorThief();
      var rgbPalette = colorThief.getPalette(img, 5);

      const rgbToHex = (r, g, b) =>
        "#" +
        [r, g, b]
          .map((x) => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          })
          .join("");

      const checkLuma = (rgb) =>
        0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]; // per ITU-R BT.709

      var artRGB = rgbPalette[0];
      for (var i = 0; i < rgbPalette.length; i++) {
        if (checkLuma(rgbPalette[i]) > 90) {
          artRGB = rgbPalette[i];
          break;
        }
      }

      var artHex = rgbToHex(artRGB[0], artRGB[1], artRGB[2]);

      if (checkLuma(artRGB) < 90) {
        artHex = shadeColor(artHex, 100);
      }

      document.documentElement.style.setProperty(
        "--modspotify_sidebar_indicator_and_hover_button_bg",
        artHex,
      );
      document.documentElement.style.setProperty(
        "--modspotify_indicator_fg_and_button_bg",
        artHex,
      );

      var iframes = document.getElementsByTagName("iframe");
      for (var x = 0; x < iframes.length; x++) {
        iframes[x].contentDocument.documentElement.style.setProperty(
          "--modspotify_sidebar_indicator_and_hover_button_bg",
          artHex,
        );
        iframes[x].contentDocument.documentElement.style.setProperty(
          "--modspotify_indicator_fg_and_button_bg",
          artHex,
        );
      }
    };
  });
}

var lastURI = "";
new window.MutationObserver(function (mutations, me) {
  var canvas = document.querySelector(
    "#now-playing-image-large > figure > div.cover-image",
  );
  if (canvas.style.backgroundImage !== "") {
    var myRegexp = /url\([\'\"]spotify:image:(.*)[\'\"]\)/g;
    var URI = myRegexp.exec(canvas.style.backgroundImage)[1];
    if (URI !== lastURI) {
      lastURI = URI;
      main(URI);
      // me.disconnect(); // stop observing
    }
  }
}).observe(document.getElementById("now-playing-image-large"), {
  childList: true,
  attributes: true,
  subtree: true,
});
