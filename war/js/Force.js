
 
Pull requests
Issues
Codespaces
Marketplace
Explore
 
@DonaldR64 
DonaldR64
/
Armyforge
Public template
forked from adam77/snapfire
Pin
 Watch 0 
Fork 22 Cannot fork because you own this repository and are not a member of any organizations.
  Star 0
Code
Pull requests
Actions
Projects
Security
Insights
Settings
 master 
Armyforge/war/js/Force.js  / Jump to 
Go to file

@andyjenkinson
andyjenkinson No longer relies on formation IDs >=500
…
Latest commit 90285ef on Feb 17, 2021
 History
 2 contributors
@andyjenkinson @magnusdurr
163 lines (160 sloc)  5.12 KB
Raw Blame

 

var Force = {
	nextId:0,
	name:'Incompertus',
	formations:[], //{id:i, type:t, upgrades:[u1,u2,u2,u2,u3,u4,u4]}
	calcPoints:function() {
		var total = 0;
		this.formations.each( function(x) {
			total += x.calcPoints();
		});
		return total;
	},
	addFormation:function(formationType, noDefaults) {
		var formation = {
								id:Force.nextId++,
								type:formationType,
								upgrades:noDefaults ? [] : formationType.defaultUpgrades(),
								count:function(upgradeType) {
									return this.upgrades.count(upgradeType);
								},
								calcPoints:function() {
									var total = this.type.pts;
									var counted = {}

									this.upgrades.each(function(u) {
											if (Array.isArray(u.pts)) {
												counted[u.name] = counted[u.name] == undefined ? 0 : counted[u.name] + 1;
												total += u.pts[counted[u.name] % u.pts.length];
											}
											else {
												total += u.pts;
											}
									});
									return total;
								},
								canRemove:function(upgradeType) {
									// check minimum constraint
									var constraint = this.type.mandatoryConstraint( upgradeType );
									if (constraint) {
										var total = this.upgrades.countAll( constraint.from );
										return total > constraint.min;
									}
									return true;
								},
								cannotAdd:function(upgradeType) {
									var why = [];
									var upgrades = this.upgrades;
									var allUpgrades = Force.allUpgrades();
									this.type.constraintsOn(upgradeType).each( function(c) {
										why.push( ArmyList.canAddUpgrade( c.perArmy ? allUpgrades : upgrades, c ) );
									});
									return why.without('');
								},
								cannotSwap:function(upgradeType,swapType) {
									var why = [];
									var upgrades = [].concat(this.upgrades).remove( upgradeType );
									var allUpgrades = Force.allUpgrades().remove( upgradeType );
									this.type.constraintsOn(swapType).each( function(c) {
										why.push( ArmyList.canAddUpgrade( c.perArmy ? allUpgrades : upgrades, c ) );
									});
									return why.without('');
								}
							};
		this.formations.push( formation );
		return formation;
	},
	getWarnings:function(){
		var msgs = [];
		ArmyList.data.formationConstraints.each(function(c) {
			if (c.maxPercent) {
				var points = 0;
				Force.formations.each( function(f){
					if (c.from.member(f.type)) {
						points += f.calcPoints();
					}
				});
				msgs.push( ArmyList.violatedPercent(Force.calcPoints(), c, points) );
			}
			else {
				msgs.push( ArmyList.violated(Force.calcPoints(), Force.formations.pluck('type'), c) );
			}
		});
		return msgs.without('');
	},
	cannotAdd:function(formationType){
//		alert(formationType.name + formationType.constraints.length);
		var why = [];
		formationType.independentConstraints.each(function(c) {
			why.push( ArmyList.canAddFormation( Force.formations.pluck('type'), c ) );
		});
		return why.without('');
	},
        canRemove:function(formation){
            var type = formation.type;
            return !type.constraints || type.constraints.all( ArmyList.canRemoveFormation.curry( Force.formations.pluck('type') ) );
        },
	allUpgrades:function() {
		return Force.formations.pluck('upgrades').flatten();
	},
	pickle:function() {
		var out = Force.name;
		Force.formations.each( function(x) {
			out += '~' + x.type.id;
			x.upgrades.uniq().each( function(u) {
				out += '~' + u.id + 'x' + x.count(u);
			});
		});
		return out;
	},
	unpickle:function(pickled) {
		try {
			Force.name = null;
			var currentFormation = null;
			decodeURIComponent(pickled).split('~').each(function(x) {
				if (!Force.name) {
					Force.name = x;
				}
				else {
					var id = parseInt(x.split('x')[0]);
					// Explicitly check whether the ID is intended to represent a formation or an upgrade.
					// Historically it was assumed id >= 500 was a formation, but this constraint is only enforced on load not on creation.
					// This meant some lists had formation IDs < 500 which consequently didn't load.
					var f = ArmyList.formationForId(id);
					if (id >= 500 || f != null) {
						console.log('Adding formation with ID: '+id);
						currentFormation = Force.addFormation(f , true );
					}
					else {
						console.log('Adding upgrade with ID: '+id);
						var count = parseInt(x.split('x')[1]);
						for (var i=0;i<count;i++) {
							currentFormation.upgrades.push( ArmyList.upgradeForId(id) );
						}
					}
				}
			});
			return name;
		}
		catch(err) {
			console.log(err);
			alert('Sorry, there was an error loading the army.');
		}
	},
	plainText:function() {
		var txt = Force.name + ', ' + Force.calcPoints() + ' POINTS \n';
		txt += ArmyList.data.id + ' (' + ArmyList.data.version + ') \n';
		txt += '================================================== \n';
		Force.formations.each( function(x) {
			txt += '\n' + x.type.name.toUpperCase() + ' ['+ x.calcPoints() +'] \n';
			var units =	x.upgrades.uniq().map( function(upgrade) {
				return (x.count(upgrade) > 1 ? x.count(upgrade) + ' ' : '') + upgrade.name;
			});
			if (x.type.units) {
				units = [x.type.units].concat( units );
			}
			txt += units.join(', ');
			txt += units.empty() ? '' : '\n';
		});
		txt += '\n\n';
		return txt;
	}
};
Give feedback
Footer
© 2023 GitHub, Inc.
Footer navigation
Terms
Privacy
Security
Status
Docs
Contact GitHub
Pricing
API
Training
Blog
About
