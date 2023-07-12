# Prototype of Path Based Coverage

A quick prototype which shows two cool concepts:

## Path based coverage

Collecting path based coverage. We can tell which paths through a function were executed while tests were run. For instance, consider a function like the following:
```cpp
int foo(int c1, int c2) {
   int out = 0;
   if (c1) {
      out += 1;
   }
   if (c2) {
      out += 1;
   }
   return out;
}
```
Suppose that this function was only ever executed with `c1 = 1, c2 = 1` and `c1 = 0, c2 = 0`. In other words, `c1` was always equal to `c2`. Bullseye would say that the function is fully covered. But it cannot answer the question: "Was it ever the case that `c1 = 1 && c2 = 0`. This tool does! You can select a set of predicate constraints and ask if we ever saw that predicate combination.

## Source to test mapping

For any such chosen predicate combination, you can then ask the tool to list all the tests which cover that predicate combination. .

When the chosen predicates span multiple functions, the tool will return any test where for each function, the predicate combination for that function was hit.

# Development Notes

## Running the Server

Sync this git repo. Then in a terminal:

```bash
npm install
npm run watch
```

Then open `localhost:3000` to see a listing of all the files which have data collected.