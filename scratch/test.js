const foo = undefined;
try {
  console.log(foo?.filter(x => x).length);
} catch (e) {
  console.log(e.message);
}
