//need to define a grid of some sort
//or a number of corresponding grids, all layered
//effectively, each node has several properties, represented across the grids

//start with a 2D grid and work it back to 1D

//need dx & dy - distance between points (metres)
let dx = 0.1;
let dy = 0.1;

//need dt - timestep for rendering
//need dt_sub - timestep for calculation

let dt = 1;
let INTERVALS = 100;
let dt_sub = dt/INTERVALS;


let nx = 10; //number of nodes in x-direction in each grid.
let ny = 10; //number of nodes in y-direction in each grid.

let initialiseGrid = () => {
  let matrix = [];
  for (let i = 0; i < nx; i++) {
    let column = [];
    for (let j = 0; j < ny; j++) {
      column.push(0);
    }
    matrix.push(column);
  }
  return matrix;
}

let v_x = initialiseGrid();
let v_y = initialiseGrid();

v_y[5][5] = 0.9;
v_x[5][5] = 0.2;

mass = initialiseGrid();
mass[5][5] = 100;
mass_new = initialiseGrid();
mass_targets = initialiseGrid();
//in the following functions, 'quantity' is any value that can be defined on nodes in the grid (e.g. anything carried in the fluid)
//this could be velocity, density, colour concentration, dye, temp, etc etc

//the velocity field and its x_comps, y_comps, determine advection for every quantity, including velocity
//the advection proportions only need to be determined ONCE then applied to each relevant quantity
//from there, the different diffusive properties of each quantity will determine how those things evolve

let advect_fwd = (quantity, targets, x_comps, y_comps) => {

  let quantity_targets = initialiseGrid();
  //loop through all nodes in vector field and advect quantities to new locations.
  for (let i = 0, l = x_comps.length; i < l; i++) {
    for (let j = 0, m = x_comps[i].length; j < m; j++) {
      if(x_comps[i][j] != 0 || y_comps[i][j] != 0){
        let dist_x = x_comps[i][j]*dt;
        let dist_y = y_comps[i][j]*dt;
        //next - determine the nodes this (off-grid) location falls between
        //i.e. resultant i =  i + dist_x (floor and ceiling), similarly for resultant j
        let i_res = i + dist_x;
        let i_res_neighbours = [Math.floor(i_res), Math.ceil(i_res)];
        if (i_res_neighbours[0] == i_res_neighbours[1]) {
          i_res_neighbours = [i_res];
        }

        let j_res = j + dist_y;
        let j_res_neighbours = [Math.floor(j_res), Math.ceil(j_res)];
        if (j_res_neighbours[0] == j_res_neighbours[1]) {
          j_res_neighbours = [j_res];
        }

        let proportions = [[0, 0],
                          [0, 0]];
        let proportions_mag = 0;

        console.log(i,j);
        console.log(i_res_neighbours);
        console.log(j_res_neighbours);
        console.log(proportions);
        let target_nodes = [];
        for (let u = 0; u < i_res_neighbours.length; u++) {
          for (let v = 0; v < j_res_neighbours.length; v++) {
            // console.log(proportions);
            target_nodes.push({x:i_res_neighbours[u], y:j_res_neighbours[v]});
          }
        }

        console.log(target_nodes);

        //then reverse-interpolate in i and j to work out how much of the quantity is received by each node
        let dist_sum = 0;
        if(target_nodes.length > 1) {
          for (let k = 0; k < target_nodes.length; k++) {
            //calculate distances of each node from the resultant point
            let target = target_nodes[k];
            target.dist = Math.sqrt(Math.pow(target.x - i_res, 2) + Math.pow(target.y - j_res, 2));
            dist_sum += 1/target.dist;
          }

          for (let k = 0; k < target_nodes.length; k++) {
            let target = target_nodes[k];
            target.fraction = (1/target.dist)/dist_sum;
          }
        } else {
          target_nodes[0].fraction = 1;
        }

        //store the fractions requested by each point for later application
        console.log(target_nodes);
      }
    }
  }
}

let advect_rev = (quantity, quantity_targets, x_comps, y_comps) => {
  //loop through all nodes in vector field, find source value that contributes and advect quantities to new locations.
  for (let i = 0, l = x_comps.length; i < l; i++) {
    for (let j = 0, m = x_comps[i].length; j < m; j++) {
      let dist_x = -1*x_comps[i][j]*dt;
      let dist_y = -1*y_comps[i][j]*dt;
      //next - determine the nodes this (off-grid location) falls between
      //i.e. resultant i =  i + dist_x (floor and ceiling), similarly for resultant j
      //then interpolate in i and j to work out the value of the quantity that 'should' exist at this (off-grid) location
      //add this quantity to the destination node, remove quantity proportionately from each contributing source node.

      let i_res = i + dist_x;
      let i_res_neighbours = [Math.floor(i_res), Math.ceil(i_res)];

      let j_res = j + dist_y;
      let j_res_neighbours = [Math.floor(j_res), Math.ceil(j_res)];

      let proportions = [[0.25,0.25][0.25,0.25]];
      let proportions_mag = 0;

      let inter_quantity = (quantity[i_res_neighbours[0]][j_res_neighbours[0]]*(i_res_neighbours[1] - i_res) +
      quantity[i_res_neighbours[1]][j_res_neighbours[0]]*(i_res - i_res_neighbours[0]))*(j_res_neighbours[1] - j_res) +
      (quantity[i_res_neighbours[0]][j_res_neighbours[1]]*(i_res_neighbours[1] - i_res) +
    quantity[i_res_neighbours[1]][j_res_neighbours[1]]*(i_res - i_res_neighbours[0]))*(j_res - j_res_neighbours[0]);

      for (let u = 0; u < i_res_neighbours.length; u++) {
        for (let v = 0; v < j_res_neighbours.length; v++) {
          proportions[u][v] = Math.sqrt(Math.pow(i_res - i_res_neighbours[u], 2) + Math.pow(j_res - j_res_neighbours[v], 2));
          proportions_mag += proportions[u][v];
        }
      }

      //normalise proportions matrix
      for (let u = 0; u < i_res_neighbours.length; u++) {
        for (let v = 0; v < j_res_neighbours.length; v++) {
          proportions[u][v] = proportions[u][v]/proportions_mag;
        }
      }


      //store the fractions requested from each point for later application
      for (let u = 0; u < i_res_neighbours.length; u++) {
        for (let v = 0; v < j_res_neighbours.length; v++) {
          quantity_targets[i_res_neighbours[u]][j_res_neighbours[v]].push({x:i, y:j, fraction:inter_quantity*proportions[u][v]});
        }
      }
    }
  }
}

//this function checks each point for the amount of a quantity requested
//this is only important if it's an unsigned quantity like mass
//go to each node. Add up the the requested proportions.
//if the proportion is > 1, then normalise the outflows.
//mutate the targets matrix as we go (no need for a deep copy)
let restrictOutflow = (targets) => {
  for (let i = 0, l = targets.length; i < l; i++) {
    for (let j = 0, m = targets.length; j < l; j++) {
      let outflows = 0;
      let thisTargets = targets[i][j];
      for (let k = 0, n = thisTargets.length; k < n; k++) {
        outflows += thisTargets[k].fraction;
      }
      if (outflows > 1) {
        //normalise the outflows
        for (let k = 0, n = thisTargets.length; k < n; k++) {
          thisTargets[k].fraction = thisTargets[k].fraction/outflows;
        }
      }
    }
  }
}

//this function goes through each node for the quantity and distributes the flows according to
//the 'quantity-targets'
let applyFlows = (quantity, quantity_new, targets) => {
  //step one - reset the quantity_new matrix
  quantity_new = initialiseGrid();
  for (let i = 0, l = targets.length; i < l; i++) {
    for (let j = 0, m = targets.length; j < l; j++) {
      let thisTargets = targets[i][j];
      for (let k = 0, n = thisTargets.length; k < n; k++) {
        let thisTarget = thisTargets[k];
        let flow = thisTarget.fraction;
        quantity_new[thisTarget.x][thisTarget.y] += flow;
        quantity_new[i][j] -= flow;
      }
    }
  }

  //update quantity matrix with new values
  //the sub arrays must be cloned, rather than referenced
  for (let i = 0, l = quantity.length; i < l; i++) {
    quantity[i] = quantity_new[i].map(elem => elem);
  }

}

advect_fwd(mass, mass_targets, v_x, v_y);
