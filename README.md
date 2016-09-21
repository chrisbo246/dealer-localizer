# -={ dealer-localizer }=-

Update multi-shops dealer affiliation links according to user country.

E.g. Convert amazon.com links to amazon.fr for French users.

### Requirements

- jQuery

## Usage

Define options as a global variable.

```
window.dealerLocalizerOptions = {
  dataPath: '/data/'
};
```

Localize dealer links for a given country.

```
dealerLocalizer.localize('a.dealer', 'FR');
```

If you omit the country code, the script try to detect the country using the freegeoip.net service.

```
dealerLocalizer.localize('a.dealer');
```

## Add a multi-shops dealer

Just edit the **/data/dealer.json** and **/data/shops.json** files.

<!--

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

-->

## Bugs

Please use the [GitHub issue tracker](https://github.com/chrisbo246/pickyvagabond/issues) for all bugs and feature requests. Before creating a new issue, do a quick search to see if the problem has been reported already.

<!--

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

-->
