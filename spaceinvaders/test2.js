const e1 = { targetTouches: [{clientX: 10}] };
const e2 = { changedTouches: [{clientX: 20}] };
const e3 = { clientX: 30 };
const getX = (e) => (e.targetTouches && e.targetTouches.length > 0) ? e.targetTouches[0].clientX : 
                    (e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : 
                    e.clientX;
console.log(getX(e1), getX(e2), getX(e3));
