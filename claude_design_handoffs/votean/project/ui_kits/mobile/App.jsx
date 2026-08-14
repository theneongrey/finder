import React from 'react';
import { OverviewScreen } from './OverviewScreen.jsx';
import { ProjectDetailScreen } from './ProjectDetailScreen.jsx';
import { TopicOverviewScreen } from './TopicOverviewScreen.jsx';
import { VoteScreen } from './VoteScreen.jsx';
import { CreatePollScreen } from './CreatePollScreen.jsx';
import { ShareSheetContent } from './ShareSheetContent.jsx';

export function App() {
  const [tab, setTab] = React.useState('overview');
  const [screen, setScreen] = React.useState('overview'); // overview | detail | vote | topicOverview | createPoll
  const [project, setProject] = React.useState(null);
  const [topic, setTopic] = React.useState(null);
  const [share, setShare] = React.useState(null); // { title, itemType, members }

  const openProject = (p) => { setProject(p); setScreen('detail'); };
  const openTopic = (t, mode) => { setTopic(t); setScreen(mode === 'vote' ? 'vote' : 'topicOverview'); };
  const openShare = (title, itemType, members) => setShare({ title, itemType, members });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', justifyContent: 'center', fontFamily: 'var(--font-body)' }}>
      {screen === 'overview' && (
        <OverviewScreen tab={tab} setTab={setTab} onOpenProject={openProject} onOpenTopic={openTopic} onShare={openShare} onCreatePoll={() => setScreen('createPoll')} />
      )}
      {screen === 'detail' && project && (
        <ProjectDetailScreen project={project} onBack={() => setScreen('overview')} onOpenTopic={openTopic} onShare={() => openShare(project.name, 'project', project.members)} />
      )}
      {screen === 'vote' && topic && (
        <VoteScreen project={project ? project.name : topic.project || 'Umfrage'} question={topic.title} onBack={() => setScreen(project ? 'detail' : 'overview')} onOverview={() => setScreen('topicOverview')} onComplete={() => setScreen('topicOverview')} />
      )}
      {screen === 'topicOverview' && topic && (
        <TopicOverviewScreen project={project ? project.name : topic.project || 'Umfrage'} question={topic.title} onBack={() => setScreen(project ? 'detail' : 'overview')} onStartVoting={() => setScreen('vote')} />
      )}
      {screen === 'createPoll' && (
        <CreatePollScreen onBack={() => setScreen('overview')} />
      )}
      {share && (
        <ShareSheetContent title={share.title} itemType={share.itemType} members={share.members} onClose={() => setShare(null)} />
      )}
    </div>
  );
}
