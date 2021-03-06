import {
  store_points_variable,
  stop_storing_points_variable,
  calculatePrecision,
  get_points,
} from './accuracyCalculator.js';

let PointCalibrate = 0;
let CalibrationPoints = {};

/**
 * Clear the canvas and the calibration button.
 */
function ClearCanvas() {
  $('.calibration').hide();
  const canvas = document.getElementById('plotting_canvas');
  // const fillColor = canvas.getContext("2d").fillColor();
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  // canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Show the instruction of using calibration at the start up screen.
 */
const popUpInstructions = () =>
  new Promise((res) => {
    ClearCalibration();
    ClearCanvas();
    Swal.fire({
      title: 'Calibration',
      html: `You'll see a video stream in the upper left corner, adjust your face position such that the green contour fits it.
       <br><br>
        When you've found the right position don't move!
        <br><br>
        Please click on each of the 9 points on the screen. You must click on each point 5 times till it goes yellow. This will calibrate your eye movements.`,
      buttons: {
        cancel: false,
        confirm: true,
      },
    }).then(() => {
      showCalibrationPoint();
      res();
    });
  });
/**
 * Show the help instructions right at the start.
 */
function helpModalShow() {
  $('#helpModal').modal('show');
}

/**
 * Load this function when the index page starts.
 * This function listens for button clicks on the html page
 * checks that all buttons have been clicked 5 times each, and then goes on to measuring the precision
 */
const calibrate = (res) => {
  // click event on the calibration buttons
  popUpInstructions().then(() => {
    $('.calibration').click(function() {
      const id = $(this).attr('id');

      if (!CalibrationPoints[id]) {
        // initialises if not done
        CalibrationPoints[id] = 0;
      }
      CalibrationPoints[id]++; // increments values

      if (CalibrationPoints[id] == 5) {
        // only turn to yellow after 5 clicks
        $(this).css('background-color', 'yellow');
        $(this).prop('disabled', true); // disables the button
        PointCalibrate++;
      } else if (CalibrationPoints[id] < 5) {
        // Gradually increase the opacity of calibration points when click to give some indication to user.
        const opacity = 0.2 * CalibrationPoints[id] + 0.2;
        $(this).css('background-color', `rgb(255,0,0,${opacity})`);
      }

      // Show the middle calibration point after all other points have been clicked.
      if (PointCalibrate == 8) {
        $('#Pt5').show();
      }

      if (PointCalibrate >= 9) {
        // last point is calibrated
        // using jquery to grab every element in Calibration class and hide them except the middle point.
        $('.calibration').hide();
        $('#Pt5').show();

        // clears the canvas
        const canvas = document.getElementById('plotting_canvas');
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        window.webgazer.showPredictionPoints(false);

        // notification for the measurement process
        Swal.fire({
          title: 'Calculating measurement',
          text:
            'Please don\'t move your mouse & stare at the middle dot for the next 5 seconds. This will allow us to calculate the accuracy of our predictions.',
          closeOnEsc: false,
          allowOutsideClick: false,
          closeModal: true,
        }).then((isConfirm) => {
          // makes the variables true for 5 seconds & plots the points
          store_points_variable(); // start storing the prediction points

          sleep(5000).then(() => {
            stop_storing_points_variable(); // stop storing the prediction points
            const past50 = get_points(); // retrieve the stored points
            const precision_measurement = calculatePrecision(past50);
            Swal.fire({
              title: 'Your accuracy measure is ' + precision_measurement + '%',
              text: `Should be ≥ 70%`,
              allowOutsideClick: false,
              cancelButtonText: 'recalibrate',
              showCancelButton: true,
            }).then((result) => {
              if (result.value) {
                // clear the calibration & hide the last middle button
                ClearCanvas();
                res(precision_measurement);
              } else {
                // use restart function to restart the calibration
                ClearCalibration();
                ClearCanvas();
                showCalibrationPoint();
              }
            });
          });
        });
      }
    });
  });
};

/**
 * Show the Calibration Points
 */
function showCalibrationPoint() {
  $('.calibration').show();
  $('#Pt5').hide(); // initially hides the middle button
}

/**
 * This function clears the calibration buttons memory
 */
function ClearCalibration() {
  window.localStorage.clear();
  // $('.calibration').css('background-color', 'red');
  $('.calibration').css('background-color', 'rgb(255,0,0,0.2)');
  $('.calibration').prop('disabled', false);

  CalibrationPoints = {};
  PointCalibrate = 0;
}

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

export default calibrate;
