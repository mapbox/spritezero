## Release Checklist

#### Update version, docs, tag, and publish
- [ ] git checkout master
- [ ] npm install
- [ ] npm run test
- [ ] Update CHANGELOG
- [ ] Update version number in `package.json`
- [ ] npm run docs
- [ ] git add .
- [ ] git commit -m 'vA.B.C'
- [ ] git tag vA.B.C
- [ ] git push origin master vA.B.C
- [ ] npm publish
