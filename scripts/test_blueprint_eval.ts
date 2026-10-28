import { generateRequirementsDerivedBlueprint } from '../src/lib/omniforge/requirements-engine';

const projects = [
  'I want to build an AI-powered crop disease detection application from leaf photos for farmers.',
  'I want to build a food delivery application.',
  'I want to make a short film.',
  'I want to build a cybersecurity platform.',
  'I want to organize a college cultural festival.',
  'I want to build a real estate portal.',
  'I want to make a true-crime podcast series.'
];

for (const p of projects) {
  const bp = generateRequirementsDerivedBlueprint(p);
  console.log('PROMPT:', p);
  console.log('  Domain:', bp.domain, '| Title:', bp.title);
  console.log('  Phases (' + bp.phases.length + '):', bp.phases.map(x => x.name));
  console.log('  Roles (' + bp.roles.length + '):', bp.roles.map(x => x.roleName));
  console.log('---');
}
