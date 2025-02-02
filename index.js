const canvas = document.getElementById("canvas");

let last_render = Date.now();
let player_pos = { x: 0.5, y: 0.5 };
let player_speed = { x: 0.01, y: 0 };
let shots = [];
let asteroids = Array.from({ length: 10 }, () => {
  return {
    pos: { x: Math.random(), y: Math.random() },
    speed: { x: Math.random() / 5, y: Math.random() / 5 },
    spots: Array.from({ length: Math.round(Math.random() * 15) }).map(() => {
      return { x: Math.random(), y: Math.random() };
    }),
  };
});

let background_stars = Array.from({ length: 10 }, () => {
  return {
    pos: { x: Math.random(), y: Math.random() },
  };
});

const update_speed = (key) => {
  if (key === "ArrowRight" || key === "d") {
    player_speed.x = Math.min(0.2, player_speed.x + 0.01);
  }
  if (key === "ArrowLeft" || key === "a") {
    player_speed.x = Math.max(-0.2, player_speed.x - 0.01);
  }
  if (key === "ArrowUp" || key === "w") {
    player_speed.y = Math.max(-0.2, player_speed.y - 0.01);
  }
  if (key === "ArrowDown" || key === "s") {
    player_speed.y = Math.min(0.2, player_speed.y + 0.01);
  }
};

window.addEventListener("keydown", (e) => {
  update_speed(e.key);
  if (e.key === " ") {
    add_shot();
  }
});

const update_pos = (pos, speed, delta_s) => {
  return {
    x:
      (pos.x + speed.x * delta_s) % 1 > 0 ? (pos.x + speed.x * delta_s) % 1 : 1,
    y:
      (pos.y + speed.y * delta_s) % 1 > 0 ? (pos.y + speed.y * delta_s) % 1 : 1,
  };
};

const update_shot_pos = (pos, speed, delta_s) => {
  const new_x = pos.x + speed.x * delta_s;
  const new_y = pos.y + speed.y * delta_s;
  if (new_x > 1 || new_x < 0 || new_y > 1 || new_y < 0) {
    return undefined;
  }
  return { x: new_x, y: new_y };
};

const add_shot = () => {
  angle = Math.atan2(player_speed.y, player_speed.x);
  shots.push({
    pos: player_pos,
    speed: { x: Math.cos(angle), y: Math.sin(angle) },
  });
};

const to_canvas_coords = (p) => {
  return {
    x: p.x * canvas.width,
    y: p.y * canvas.height,
  };
};

const draw_shots = (delta_s) => {
  const scale = (canvas.height * canvas.width) / (canvas.height + canvas.width);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  shots = shots
    .map((shot) => {
      shot.pos = update_shot_pos(shot.pos, shot.speed, delta_s);
      if (shot.pos === undefined) {
        return undefined;
      }
      const p = to_canvas_coords(shot.pos);
      ctx.beginPath();
      ctx.arc(p.x, p.y, scale / 100, 0, 2 * Math.PI);
      ctx.fill();
      return shot;
    })
    .filter((shot) => shot != undefined);
};

const draw_asteroids = (delta_s) => {
  const scale = (canvas.height * canvas.width) / (canvas.height + canvas.width);
  const ctx = canvas.getContext("2d");
  asteroids = asteroids.map((asteroid) => {
    asteroid.pos = update_pos(asteroid.pos, asteroid.speed, delta_s);
    ctx.fillStyle = "gray";
    const p = to_canvas_coords(asteroid.pos);
    ctx.beginPath();
    ctx.arc(p.x, p.y, scale / 18, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#606060";
    asteroid.spots.forEach((spot) => {
      ctx.beginPath();
      ctx.arc(
        p.x + (spot.x * scale) / 15 - scale / 30,
        p.y + (spot.y * scale) / 15 - scale / 30,
        scale / 80,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
    return asteroid;
  });
};

const draw_stars = () => {
  const scale = (canvas.height * canvas.width) / (canvas.height + canvas.width);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "yellow";
  background_stars = background_stars.map((star) => {
    const p = to_canvas_coords(star.pos);
    ctx.beginPath();
    ctx.arc(p.x, p.y, scale / 150, 0, 2 * Math.PI);
    ctx.fill();
    return star;
  });
};

const get_triangle = (player, speed, scale, h, w) => {
  const angle = Math.atan2(speed.y * h, speed.x * w);
  const triangle = [
    {
      x: player.x + 0.05 * Math.cos(angle) * scale,
      y: player.y + 0.05 * Math.sin(angle) * scale,
    },
    {
      x: player.x + 0.02 * Math.cos(angle + Math.PI / 2) * scale,
      y: player.y + 0.02 * Math.sin(angle + Math.PI / 2) * scale,
    },
    {
      x: player.x + 0.02 * Math.cos(angle - Math.PI / 2) * scale,
      y: player.y + 0.02 * Math.sin(angle - Math.PI / 2) * scale,
    },
  ];
  return triangle.map((p) => {
    return {
      x: p.x,
      y: p.y,
    };
  });
};

const dist = (p1, p2) => Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));

const is_collision = (ps, scale) => {
  let collided = false
  ps.forEach((p) => {
    asteroids.forEach((a) => {
      //console.log(dist(to_canvas_coords(a.pos), p), scale/ 18);
      if (dist(to_canvas_coords(a.pos), p) < (scale / 18)) {
        console.log("Internal Collision")
        collided = true
      }
    });
  });
  return collided;
};

const draw_player = (delta_s) => {
  const scale = (canvas.height * canvas.width) / (canvas.height + canvas.width);
  const ctx = canvas.getContext("2d");
  player_pos = update_pos(player_pos, player_speed, delta_s);
  ctx.fillStyle = "red";
  const player = to_canvas_coords(player_pos);
  const triangle = get_triangle(
    player,
    player_speed,
    scale,
    canvas.height,
    canvas.width
  );
  ctx.beginPath();
  ctx.moveTo(triangle[0].x, triangle[0].y);
  ctx.lineTo(triangle[1].x, triangle[1].y);
  ctx.lineTo(triangle[2].x, triangle[2].y);
  ctx.closePath();
  ctx.fill();
  if (is_collision(triangle, scale)) {
    console.log("COLLISION")
    return false;
  }
  return true;
};

const loop = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";

  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const delta_s = (Date.now() - last_render) / 1000;
  last_render = Date.now();
  draw_stars();
  draw_shots(delta_s);
  draw_asteroids(delta_s);
  if (draw_player(delta_s)) {
    requestAnimationFrame(loop);
  }
};

requestAnimationFrame(loop);
