npm run build

cd public

git init
git add -A
git commit -m 'deploy'

git push -f git@github.com:Wallace4ever/wallace4ever.github.io.git master

cd ../