const A1: f32 = 0.0;
const A2: f32 = 1.0  / 4.0;
const A3: f32 = 3.0  / 8.0;
const A4: f32 = 12.0 / 13.0;
const A5: f32 = 1.0;
const A6: f32 = 1.0  / 2.0;

const B11: f32 =  0.0;
const B21: f32 =  1.0    / 4.0;
const B31: f32 =  3.0    / 32.0;
const B32: f32 =  9.0    / 32.0;
const B41: f32 =  1932.0 / 2197.0;
const B42: f32 = -7200.0 / 2197.0;
const B43: f32 =  7296.0 / 2197.0;
const B51: f32 =  439.0  / 216.0;
const B52: f32 = -8.0;
const B53: f32 =  3680.0 / 513.0;
const B54: f32 = -845.0  / 4104.0;
const B61: f32 = -8.0    / 27.0;
const B62: f32 =  2.0;
const B63: f32 = -3544.0 / 2565.0;
const B64: f32 =  1859.0 / 4104.0;
const B65: f32 = -11.0   / 40.0;

const C1: f32 =  25.0   / 216.0;
const C2: f32 =  0.0;
const C3: f32 =  1408.0 / 2565.0;
const C4: f32 =  2197.0 / 4104.0;
const C5: f32 = -1.0    / 5.0;
const C6: f32 =  0.0;

const C1H: f32 =  16.0    / 135.0;
const C2H: f32 =  0.0;
const C3H: f32 =  6656.0  / 12825.0;
const C4H: f32 =  28561.0 / 56430.0;
const C5H: f32 = -9.0     / 50.0;
const C6H: f32 =  2.0     / 55.0;

const TE1: f32 = C1H - C1;
const TE2: f32 = C2H - C2;
const TE3: f32 = C3H - C3;
const TE4: f32 = C4H - C4;
const TE5: f32 = C5H - C5;
const TE6: f32 = C6H - C6;

const FAC: f32 = 0.9;
const FAC_MIN: f32 = 0.1;
const FAC_MAX: f32 = 3.0;
const SQRT_THIRD: f32 = sqrt(1.0 / 3.0);

// numerically integrates from t0 to tn
fn rkf45(y0: vec3f, t0: f32, tn: f32, atol: vec3f, rtol: vec3f, index: u32, derivativeFunction: u32) -> vec3f {
  // let inverseScale: vec3f = 1.0 / (atol + abs(y0) * rtol);
  // let f0: vec3f = derivative(derivativeFunction, index, t0, y0);
  // // RMS
  // let d0: f32 = length(y0 * inverseScale) * SQRT_THIRD;
  // let d1: f32 = length(f0 * inverseScale) * SQRT_THIRD;

  // let h0: f32 = select(0.01 * (d0 / d1), 1e-6, max(d0, d1) < 1e-5);
  // let y1: vec3f = y0 + h0 * f0;
  // let f1: vec3f = derivative(derivativeFunction, index, t0 + h0, y1);
  // let d2: f32 = length((f1 - f0) * inverseScale) * SQRT_THIRD / h0;
  // let h1: f32 = select(pow(0.01 / max(d1, d2), 0.2), max(1e-6, h0 * 1e-3), max(d1, d2) <= 1e-15);

  // var stepSize: f32 = min(100 * h0, h1);

  var stepSize: f32 = (tn - t0) / 100.0;
  var t: f32 = t0;
  var y: vec3f = y0;
  var facMax: f32 = FAC_MAX;

  while(t < tn){
    if(t + stepSize > tn){
      stepSize = tn - t;
    }

    let k1: vec3f = derivative(derivativeFunction, index, t + A1 * stepSize, y);
    let k2: vec3f = derivative(derivativeFunction, index, t + A2 * stepSize, y + stepSize * (B21 * k1));
    let k3: vec3f = derivative(derivativeFunction, index, t + A3 * stepSize, y + stepSize * (B31 * k1 + B32 * k2));
    let k4: vec3f = derivative(derivativeFunction, index, t + A4 * stepSize, y + stepSize * (B41 * k1 + B42 * k2 + B43 * k3));
    let k5: vec3f = derivative(derivativeFunction, index, t + A5 * stepSize, y + stepSize * (B51 * k1 + B52 * k2 + B53 * k3 + B54 * k4));
    let k6: vec3f = derivative(derivativeFunction, index, t + A6 * stepSize, y + stepSize * (B61 * k1 + B62 * k2 + B63 * k3 + B64 * k4 + B65 * k5));

    let newY: vec3f = y + stepSize * (C1H * k1 + C2H * k2 + C3H * k3 + C4H * k4 + C5H * k5 + C6H * k6);
    let error: f32 = truncationError(k1, k2, k3, k4, k5, k6, atol, rtol, y, newY);

    stepSize *= clamp(FAC * pow(error, -0.2), FAC_MIN, facMax);

    if(error <= 1.0){
      y = newY;
      t += stepSize;
      facMax = FAC_MAX;
    } else {
      facMax = 1.0;
    }
  }

  return y;
}

fn truncationError(
  k1: vec3f, k2: vec3f, k3: vec3f, k4: vec3f, k5: vec3f, k6: vec3f,
  atol: vec3f, rtol: vec3f,
  y0: vec3f, y1: vec3f,
) -> f32 {
  let scale: vec3f = atol + max(abs(y0), abs(y1)) * rtol;
  let error: vec3f = TE1 * k1 + TE2 * k2 + TE3 * k3 + TE4 * k4 + TE5 * k5 + TE6 * k6;
  let scaled: vec3f = error / scale;

  // RMSE
  return length(scaled) * SQRT_THIRD;
}
