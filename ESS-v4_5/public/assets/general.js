function Report360Generation(BaseURL, URL, Key) {
  $('<iframe />').attr('src', BaseURL + 'Modules/HR/360Survey/360Feedback/360FeedbackDR.aspx?url=' + BaseURL + 'Modules/' + URL + '|key=' + Key).hide().appendTo('body');
}

function Report360GenerationDownload(BaseURL, URL, Key) {
  $('<iframe />').attr('src', BaseURL + 'Modules/HR/360Survey/360Feedback/360FeedbackDBF.aspx?url=' + BaseURL + 'Modules/' + URL + '|key=' + Key).hide().appendTo('body');
}




let canvasName = "";
let isSmall = true;
let moodPercent = 40;
let counted = 0;
let totalDots = 2033;
let pointSizeX = 18;
let pointSizeY = 22;
let maxRadius = 120;
let eyesPoints = 36;
let mouthSize = 0.52;
let lipsWidth = 20;
let lipsLocHappyY = 0;
let lipsLocSadY = 33;
let lipsLocNeutralY = 23;
let lipsLocNeutralX = 56;
let ColorWithPercentCopy = [];
let ColorWithPercent = [];
// Emoji Work Start
function LoadValues(Param_canvasName, Param_moodPercent, Param_ColorWithPercent, Param_isSmall) {
  ColorWithPercentCopy = [];
  ColorWithPercent = [];
  counted = 0;
  totalDots = 2033;
  pointSizeX = 18;
  pointSizeY = 22;
  maxRadius = 120;
  eyesPoints = 36;
  mouthSize = 0.56;
  lipsWidth = 20;
  lipsLocHappyY = 0;
  lipsLocSadY = 33;
  lipsLocNeutralY = 23;
  lipsLocNeutralX = 46;

  canvasName = Param_canvasName;
  if (document.getElementById(canvasName)) {
    let ctx11 = document.getElementById(canvasName).getContext("2d");
    ctx11.clearRect(0, 0, ctx11.canvas.width, ctx11.canvas.height);
    document.getElementById(canvasName).style.marginTop = '';
    ctx11.globalCompositeOperation = 'source-over';
    moodPercent = Param_moodPercent;
    isSmall = Param_isSmall;
    if (Param_ColorWithPercent != '' && Param_ColorWithPercent != undefined) {
      Param_ColorWithPercent.forEach(function (val, index, object) {
        let ObjectForArray = {};
        ObjectForArray.NoOfDots = 0;
        ObjectForArray.PlottedDots = 0;
        ObjectForArray.Color = val.Color;
        ObjectForArray.Percent = val.Percent;
        ObjectForArray.DotSize = val.DotSize;
        ColorWithPercent.push(ObjectForArray);
      });
    }
    else {
      console.log('Blank array passed');
    }
    lipsLocSadY = 33 * (((100 - moodPercent) / 100) + 1);


    if (isSmall) {
      maxRadius = 56;
      pointSizeX = 10;
      pointSizeY = 14;
      totalDots = 404;
      eyesPoints = 19;
      mouthSize = 0.26;
      lipsWidth = 10;
      lipsLocHappyY = -10;
      lipsLocSadY = 16;
      lipsLocNeutralY = 0;
      lipsLocNeutralX = 23;
    }
    //ColorWithPercent.sort(function(a, b){return b-a});

    ColorWithPercent.forEach(function (val, index, object) {
      val.NoOfDots = Math.round((val.Percent / 100) * totalDots);
      console.log(val.Percent);
    });
    for (i = 0; i < ColorWithPercent.length; i++) {
      ColorWithPercentCopy[i] = ColorWithPercent[i];
    }
    console.log(ColorWithPercentCopy);
    console.log(ColorWithPercent);
    document.getElementById(canvasName).style.transform = '';
    for (k = 3.5; k < maxRadius; k += 3.5) {
      DrawingCircleWithMultipleRadius(k);
    }
    if (moodPercent > 50) {
      drawEyes(1);
      drawMouth(1); //Draw happy face
    }
    else if (moodPercent < 50) {
      drawEyes(-1);
      drawMouth(-1); //Draw sad face
    }
    else {
      drawEyes(0);
      drawMouth(0); //Neutral face
    }
  }
}


function ThumbsUpNDown(Param_canvasName, Param_moodPercent, Param_ColorWithPercent, Param_isSmall) {

  ColorWithPercentCopy = [];
  ColorWithPercent = [];
  counted = 0;
  totalDots = 1006;
  pointSizeX = 18;
  pointSizeY = 22;
  maxRadius = 120;
  eyesPoints = 36;
  mouthSize = 0.56;
  lipsWidth = 20;
  lipsLocHappyY = 0;
  lipsLocSadY = 33;
  lipsLocNeutralY = 23;
  lipsLocNeutralX = 56;

  canvasName = Param_canvasName;
  if (document.getElementById(canvasName)) {
    moodPercent = Param_moodPercent;
    isSmall = Param_isSmall;
    if (Param_ColorWithPercent != '' && Param_ColorWithPercent != undefined) {
      Param_ColorWithPercent.forEach(function (val, index, object) {
        var ObjectForArray = {};
        ObjectForArray.NoOfDots = 0;
        ObjectForArray.PlottedDots = 0;
        ObjectForArray.Color = val.Color;
        ObjectForArray.Percent = val.Percent;
        ObjectForArray.DotSize = val.DotSize;
        ColorWithPercent.push(ObjectForArray);
      });
    }
    else {
      console.log('Blank array passed');
    }

    //if (isSmall) {
    //  maxRadius = 56;
    //  pointSizeX = 10;
    //  pointSizeY = 14;
    //  totalDots = 404;
    //  eyesPoints = 19;
    //  mouthSize = 0.26;
    //  lipsWidth = 10;
    //  lipsLocHappyY = -10;
    //  lipsLocSadY = 16;
    //  lipsLocNeutralY = 0;
    //  lipsLocNeutralX = 26;
    //}
    //ColorWithPercent.sort(function (a, b) { return b - a });

    ColorWithPercent.forEach(function (val, index, object) {
      val.NoOfDots = Math.round((val.Percent / 100) * totalDots);
    });
    for (i = 0; i < ColorWithPercent.length; i++) {
      ColorWithPercentCopy[i] = ColorWithPercent[i];
    }
    var ctx = document.getElementById(canvasName).getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    var centerX = ctx.canvas.width / 2;
    var centerY = ctx.canvas.height / 2;

    console.log(ColorWithPercentCopy);
    console.log(ColorWithPercent);
    var arrNotToPlotX = [];
    var arrNotToPlotY = [];
    // if(moodPercent > 50)
    // {
    thumbsUp(ctx);
    // }
    // else if (moodPercent < 50)
    // {
    // 	thumbsDown(ctx);
    // }
  }
}
function thumbsDown(ctx) {
  ctx.translate(0, ctx.canvas.width);
  ctx.scale(-1, 1);
  ctx.rotate(Math.PI);
  thumbsUp(ctx);
}

function thumbsUp(ctx) {
  for (var x = 30; x < 256; x += 6) {
    for (var y = 24; y < 259; y += 6) {
      var Index = 0;
      if (		//(x > 60 || y > 80)
        //&&	
        (x > 72 || y < 242)
        && ((x > 72) || (y > 132))
        && ((x > 92) || (y > 92))
        && ((x > 102) || (y > 102))
        && ((x > 112) || (y > 112))
        && ((x > 135) || (y > 88))
        //&&	(!((x == 114 || x == 120 || x == 126 || x == 132) && (y == 78)))
        //&&	(!((x == 84 || x == 90 || x == 96 || x == 102 || x == 114 || x == 120 || x == 126 || x == 132) && (y == 84)))
        //&&	(!((x == 84 || x == 90 || x == 96 || x == 102) && (y == 102)))
        && ((x < 185) || (y > 112))
        && ((x < 235) || (y < 228))
        && ((x < 248) || (y < 192))
      ) {
        if (counted < totalDots) {
          Index = RandomColorIndex();
          if (ColorWithPercent[Index] != undefined) {
            ctx.fillStyle = ColorWithPercent[Index].Color;
            ColorWithPercent[Index].PlottedDots++;
            pointSize = ColorWithPercent[Index].DotSize;
            ctx.beginPath();
            ctx.arc(x + Math.floor(Math.random() * 3), y + Math.floor(Math.random() * 3), pointSize, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
          }
        }
        counted++;
      }
      //if (x >= 246 && y >= 246)
      //  alert(counted);
    }
  }
  // ctx.fillStyle = "white";
  // ctx.beginPath();
  // ctx.ellipse(58, 49, 86,76,0, 0, Math.PI * 2, true);
  // ctx.fill();	  
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineCap = "round";
  ctx.beginPath();

  ctx.ellipse(155, 247, 90, 25, 0.08, Math.PI * 0.26, Math.PI * 0.82, false);
  ctx.lineWidth = 19;
  ctx.strokeStyle = "white"
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 255, 255, 0)";
  ctx.beginPath();
  ctx.ellipse(69, 87, 36, 33, -0.96, Math.PI * 0.25, Math.PI * 0.96, false);
  ctx.lineWidth = 28;
  ctx.strokeStyle = "white"
  ctx.stroke();
  //ctx.fillStyle = "rgba(255, 255, 255, 0)"
  //ctx.fillStyle = "rgba(255, 255, 255, 0)"
  ctx.beginPath();
  ctx.ellipse(93, 63, 42, 56, 0.26, Math.PI * 0.06, Math.PI * 1.72, true);
  ctx.lineWidth = 11;
  ctx.strokeStyle = "white"
  ctx.stroke();
  //ctx.fillStyle = "rgba(255, 255, 255, 0)"
  ctx.beginPath();
  ctx.ellipse(128, 105, 26, 16, -0.76, Math.PI * 1.26, Math.PI * 1.67, false);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "white"
  ctx.stroke();
  //ctx.fillStyle = "rgba(255, 255, 255, 0)"
  ctx.beginPath();
  ctx.ellipse(160, 48, 23, 36, -0.66, Math.PI * 1.26, Math.PI * 1.66, false);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "white"
  ctx.stroke();
  //ctx.fillStyle = "rgba(255, 255, 255, 0)"
  ctx.beginPath();
  ctx.ellipse(149, 70, 42, 56, 0.16, Math.PI * 0.09, Math.PI * 1.46, true);
  ctx.lineWidth = 17;
  ctx.strokeStyle = "white"
  ctx.stroke();
  //ctx.fillStyle = "rgba(255, 255, 255, 0)"
  ctx.beginPath();
  ctx.ellipse(226, 60, 33, 56, 0.6, Math.PI * 0.09, Math.PI * 0.98, false);
  ctx.lineWidth = 12;
  ctx.strokeStyle = "white"
  ctx.stroke();
  //ctx.fillStyle = "rgba(255, 255, 255, 0)"
  ctx.beginPath();
  ctx.ellipse(234, 130, 25, 28, 1.5, Math.PI * -0.23, Math.PI * 1.03, true);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "white"
  ctx.stroke();
  //ctx.fillStyle = "rgba(255, 255, 255, 0)"
  ctx.beginPath();
  ctx.ellipse(234, 166, 28, 28, 1.5, Math.PI * -0.19, Math.PI * 1.28, true);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "white"
  ctx.stroke();
  //ctx.fillStyle = "rgba(255, 255, 255, 0)"
  ctx.beginPath();
  ctx.ellipse(222, 205, 28, 33, 1.5, Math.PI * -0.20, Math.PI * 1.38, true);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "white"
  ctx.stroke();
  //ctx.fillStyle = "rgba(255, 255, 255, 0)"
  ctx.beginPath();
  ctx.ellipse(223, 239, 26, 19, 1.8, Math.PI * 0, Math.PI * 1.35, true);
  ctx.lineWidth = 9;
  ctx.strokeStyle = "white"
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(230, 243, 26, 19, 1.8, Math.PI * 0, Math.PI * 1.35, true);
  ctx.lineWidth = 9;
  ctx.strokeStyle = "white"
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  document.getElementById(canvasName).style.marginTop = '';

  for (let i = 100; i >= moodPercent; i--) {
    let canvasNamess = canvasName;
    let val = i;
    let IsLess = false;
    let IsSmallHand = isSmall;
    if (i <= Math.ceil(moodPercent)) {
      val = moodPercent;
      //alert('IF Statement');
      IsLess = true;
    }

    setTimeout(function () {
      //alert(canvasNamess);
      let RotatePercent = ((100 - val) / 100) * 180;
      document.getElementById(canvasNamess).style.transform = 'rotate(' + RotatePercent + 'deg)';
      if (IsLess && !IsSmallHand) {
        if (RotatePercent >= 95 && RotatePercent <= 139) {
          document.getElementById(canvasNamess).style.marginTop = '22px';
        }
        else
          document.getElementById(canvasNamess).style.marginTop = '';
      }
    }, (100 - i) * 26);
  }
  if (isSmall) {
    document.getElementById(canvasName).style.marginTop = '10px';
  }
}

function drawEyes(Status) {
  var ctx = document.getElementById(canvasName).getContext("2d");
  var centerX = ctx.canvas.width / 2;
  var centerY = ctx.canvas.height / 2;
  var HeighestColor = ColorWithPercentCopy[0].Color;
  var SecondHeighestColor = ColorWithPercentCopy[1].Color;
  if (HeighestColor == '' || HeighestColor == undefined)
    HeighestColor = 'white';
  if (SecondHeighestColor == '' || SecondHeighestColor == undefined)
    SecondHeighestColor = 'white';
  if (Status == 1) {
    ctx.fillStyle = "white";
  }
  else if (Status == -1) {
    ctx.fillStyle = "white";
  }
  else if (Status == 0) {
    ctx.fillStyle = "white";
  }
  ctx.beginPath(); //Start path
  ctx.ellipse(centerX - eyesPoints, centerY - eyesPoints, pointSizeX, pointSizeY, 0, 0, Math.PI * 2, true);

  ctx.ellipse(centerX + eyesPoints, centerY - eyesPoints, pointSizeX, pointSizeY, 0, 0, Math.PI * 2, true);	// Draw a point using the arc function of the canvas with a point structure.
  ctx.fill(); // Close the path and fill.

}
function drawMouth(Status) {
  //status:1 means smile 0 means neutral and -1 means sad
  var pointSizeX = mouthSize * 100;
  var startPoint = 0.207;// 0.047
  var endPoint = 0.80;//0.96
  var ctx = document.getElementById(canvasName).getContext("2d");
  var centerX = ctx.canvas.width / 2;
  var centerY = (ctx.canvas.height / 2) + 16;
  ctx.fillStyle = "rgba(255, 255, 255, 0)"
  ctx.beginPath(); //Start path
  if (Status == 1) {
    var MouthVariations = (moodPercent * (0.16 - 0) / 100) + 0;
    var pointSizeY = Math.round((moodPercent * mouthSize)); //0.56 means 56
    ctx.ellipse(centerX, centerY + lipsLocHappyY, pointSizeX - 3, pointSizeY + MouthVariations, 0, Math.PI * (startPoint - MouthVariations), Math.PI * (endPoint + MouthVariations), false);//SmileFace
    ctx.lineCap = "round";
    ctx.lineWidth = lipsWidth;
    // line color		
    ctx.strokeStyle = "white";
    ctx.stroke();
  }
  else if (Status == -1) {
    var MouthVariations = ((100 - moodPercent) * (0.16 - 0) / 100) + 0;
    var pointSizeY = Math.round(((100 - moodPercent) * mouthSize)); //0.56 means 56 
    ctx.ellipse(centerX, centerY + lipsLocSadY, pointSizeX - 3, pointSizeY + MouthVariations, 0, Math.PI * ((startPoint - MouthVariations) + 1), Math.PI * ((endPoint + MouthVariations) + 1), false); //SadFace
    ctx.lineCap = "round";
    ctx.lineWidth = lipsWidth;
    // line color
    ctx.strokeStyle = "white";
    ctx.stroke();
  } else if (Status == 0) {
    ctx.moveTo(centerX - lipsLocNeutralX, centerY + lipsLocNeutralY);
    ctx.lineTo(centerX + lipsLocNeutralX, centerY + lipsLocNeutralY);
    ctx.lineCap = "round";
    ctx.lineWidth = lipsWidth;
    // line color
    ctx.strokeStyle = "white";
    ctx.stroke();
  }

  //ctx.arc(centerX, centerY + 16, 56, 0, Math.PI, false);// Draw a point using the arc function of the canvas with a point structure.
  ctx.closePath();
  ctx.fill(); // Close the path and fill.
}

function DrawingCircleWithMultipleRadius(radius) {
  var ctx = document.getElementById(canvasName).getContext("2d");
  //var ctx=canvas.getContext("2d");

  let pointSize = 0;
  let dotsPerCircle = radius - 2;
  if (radius <= 10)
    dotsPerCircle = radius + (radius / 2);

  let interval = (Math.PI * 2) / dotsPerCircle;

  let centerX = ctx.canvas.width / 2;
  let centerY = ctx.canvas.height / 2;
  var radius = radius;
  for (var i = 0; i < dotsPerCircle; i++) {
    desiredRadianAngleOnCircle = interval * i;
    var Index = 0;
    if (counted < totalDots) {
      Index = RandomColorIndex();
      if (ColorWithPercent[Index] != undefined) {
        ctx.fillStyle = ColorWithPercent[Index].Color;
        ColorWithPercent[Index].PlottedDots++;
        pointSize = ColorWithPercent[Index].DotSize;
        var x = centerX + radius * Math.cos(desiredRadianAngleOnCircle);
        var y = centerY + radius * Math.sin(desiredRadianAngleOnCircle);

        ctx.beginPath();
        ctx.arc(x + Math.floor(Math.random() * 3), y + Math.floor(Math.random() * 3), pointSize, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    }
    counted++;
  }
}
var countRandomColor = 0;
function RandomColorIndex() {
  //ColorWithPercent.forEach(function(val, index, object){
  //  if(val.PlottedDots >= val.NoOfDots)
  //    object.splice(index, 1);
  //});
  var totalColors = ColorWithPercent.length;
  var colorPercent = 0;
  for (it = 0; it < totalColors; it++) {
    if (ColorWithPercent[it].PlottedDots >= ColorWithPercent[it].NoOfDots) {
      ColorWithPercent.splice(it, 1);
      it = 0;
      var totalColors = ColorWithPercent.length;
    }
  }
  if (ColorWithPercent.length > 0) {
    colorPercent = ColorWithPercent[0].Percent;
  }
  var maximum = ColorWithPercent.length;
  var Random = Math.random();
  var randomnumber = 0;
  //alert (Math.floor(0.23));
  if (!(countRandomColor == 0 && maximum > 2) || colorPercent <= 25)
    randomnumber = Math.floor(Random * maximum);
  else
    randomnumber = Math.floor((Random - (Random / 2)) * (maximum / 1.006));

  //if (maximum > 1 && countRandomColor != 0)
  //  randomnumber = Math.floor(Random - (Random / countRandomColor) * maximum / 1.16);
  //else {
  //  randomnumber = 1;
  //}
  countRandomColor++;
  if (countRandomColor > 2)
    countRandomColor = 0;
  return randomnumber;
}

 // Emoji Work End
